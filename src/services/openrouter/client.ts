import { AuthenticationError, ProviderError, RateLimitError, ValidationError } from "@/core/errors";
import { createLogger } from "@/core/logging";
import { httpFetch, parseRetryAfterMs, type HttpFetchOptions } from "@/lib/http";

import { type z } from "zod";

import {
  creditsResponseSchema,
  keyInfoResponseSchema,
  modelEndpointsResponseSchema,
  videoJobSchema,
  videoModelSchema,
  videoModelsResponseSchema,
  type CreditsDto,
  type KeyInfoDto,
  type VideoJobDto,
  type VideoJobRequestDto,
  type VideoModelDto,
} from "./dto";

/**
 * Low-level OpenRouter HTTP client.
 *
 * Speaks wire formats only (DTOs in, DTOs out) and owns the HTTP semantics
 * of this one API: auth headers, status → error mapping, response
 * validation. It knows nothing about domain types, storage or React —
 * which is exactly what makes it reusable by the provider, the session
 * and the generation queue.
 */

const log = createLogger("openrouter");

const BASE_URL = "https://openrouter.ai/api/v1";

/** Video jobs can take minutes; downloads can be tens of megabytes. */
const SUBMIT_TIMEOUT_MS = 60_000;
const DOWNLOAD_TIMEOUT_MS = 600_000;

/** Attribution headers OpenRouter asks apps to send. */
const APP_HEADERS = {
  "HTTP-Referer": "https://littlestudio.app",
  "X-Title": "Little Studio",
} as const;

export type ApiKeyResolver = () => Promise<string | null>;

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  apiKeyOverride?: string;
  fetchOptions?: HttpFetchOptions;
}

export class OpenRouterClient {
  constructor(private readonly resolveApiKey: ApiKeyResolver) {}

  /** Performs a request against the API and maps HTTP failures to errors. */
  private async request(path: string, options: RequestOptions = {}): Promise<Response> {
    const apiKey = options.apiKeyOverride ?? (await this.resolveApiKey());
    if (apiKey === null || apiKey === "") {
      throw new AuthenticationError("No API key configured.");
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      ...APP_HEADERS,
    };
    const init: RequestInit = { method: options.method ?? "GET", headers };
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(options.body);
    }

    const response = await httpFetch(`${BASE_URL}${path}`, init, options.fetchOptions ?? {});

    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError();
    }
    if (response.status === 429) {
      const retryAfterMs = parseRetryAfterMs(response);
      throw new RateLimitError(retryAfterMs === null ? null : Math.ceil(retryAfterMs / 1000));
    }
    if (!response.ok) {
      const detail = await readErrorMessage(response);
      if (response.status === 400) {
        // The provider rejected our parameters — surface its exact reason.
        throw new ValidationError(detail ?? `OpenRouter rejected the request to ${path}.`);
      }
      throw new ProviderError(
        "openrouter",
        `HTTP_${response.status}`,
        detail ?? `OpenRouter responded with ${response.status} for ${path}.`,
        { status: response.status },
      );
    }

    return response;
  }

  /** Performs a GET/POST and validates the JSON body. */
  private async requestJson(path: string, options: RequestOptions = {}): Promise<unknown> {
    const response = await this.request(path, options);
    try {
      return (await response.json()) as unknown;
    } catch (error) {
      throw new ProviderError(
        "openrouter",
        "MALFORMED_RESPONSE",
        `Non-JSON response for ${path}.`,
        {
          cause: error,
        },
      );
    }
  }

  /** Validates an API key by asking OpenRouter about it. Does not store it. */
  async validateKey(apiKey: string): Promise<KeyInfoDto> {
    const body = await this.requestJson("/key", { apiKeyOverride: apiKey });
    return this.parse(keyInfoResponseSchema, body, "/key").data;
  }

  /** Metadata about the stored key (label, limits, tier). */
  async getKeyInfo(): Promise<KeyInfoDto> {
    const body = await this.requestJson("/key");
    return this.parse(keyInfoResponseSchema, body, "/key").data;
  }

  /** Lifetime credits purchased/used; balance = credits − usage. */
  async getCredits(): Promise<CreditsDto> {
    const body = await this.requestJson("/credits");
    return this.parse(creditsResponseSchema, body, "/credits").data;
  }

  /**
   * The video model catalog (GET /videos/models) with capability metadata.
   * Items are validated one by one: a single malformed entry is logged and
   * skipped instead of failing the whole catalog.
   */
  async listVideoModels(): Promise<VideoModelDto[]> {
    const body = await this.requestJson("/videos/models");
    const envelope = this.parse(videoModelsResponseSchema, body, "/videos/models");

    const models: VideoModelDto[] = [];
    let skipped = 0;
    for (const item of envelope.data) {
      const result = videoModelSchema.safeParse(item);
      if (result.success) {
        models.push(result.data);
      } else {
        skipped += 1;
      }
    }
    if (skipped > 0) {
      log.warn(`skipped ${skipped} malformed model entries from /videos/models`);
    }
    log.debug(`loaded ${models.length} video models`);
    return models;
  }

  /**
   * The provider slugs serving one model (GET /models/{id}/endpoints).
   * Passthrough parameters must be keyed by these slugs; OpenRouter only
   * forwards the entry of the provider that actually takes the request.
   */
  async listModelEndpointTags(modelId: string): Promise<string[]> {
    // The id contains a slash ("google/veo-3.1") that must stay a path
    // separator; encode each segment, not the id as a whole.
    const path = modelId.split("/").map(encodeURIComponent).join("/");
    const body = await this.requestJson(`/models/${path}/endpoints`);
    const envelope = this.parse(modelEndpointsResponseSchema, body, "/models/{id}/endpoints");
    return [...new Set(envelope.data.endpoints.map((endpoint) => endpoint.tag))];
  }

  /**
   * Submits a video generation job. Deliberately not retried: a lost
   * response after the server accepted the job would double-bill on retry.
   */
  async createVideoJob(request: VideoJobRequestDto): Promise<VideoJobDto> {
    const body = await this.requestJson("/videos", {
      method: "POST",
      body: request,
      fetchOptions: {
        timeoutMs: SUBMIT_TIMEOUT_MS,
        retry: { retries: 0, baseDelayMs: 0, maxDelayMs: 0 },
      },
    });
    return this.parse(videoJobSchema, body, "/videos");
  }

  /** Current state of a previously submitted job. */
  async getVideoJob(jobId: string): Promise<VideoJobDto> {
    const body = await this.requestJson(`/videos/${encodeURIComponent(jobId)}`);
    return this.parse(videoJobSchema, body, "/videos/{id}");
  }

  /** Downloads the finished MP4 through the authenticated content endpoint. */
  async downloadVideoContent(jobId: string): Promise<Blob> {
    const response = await this.request(`/videos/${encodeURIComponent(jobId)}/content?index=0`, {
      fetchOptions: { timeoutMs: DOWNLOAD_TIMEOUT_MS },
    });
    return response.blob();
  }

  private parse<T>(schema: z.ZodType<T>, body: unknown, path: string): T {
    const result = schema.safeParse(body);
    if (!result.success) {
      log.error(`response validation failed for ${path}`, {
        issues: result.error.issues.map((issue) => issue.message).slice(0, 5),
      });
      throw new ValidationError(
        `OpenRouter returned an unexpected shape for ${path}.`,
        result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      );
    }
    return result.data;
  }
}

/** Best-effort extraction of OpenRouter's error message from a failed body. */
async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as unknown;
    if (typeof body !== "object" || body === null) return null;
    const error = (body as { error?: unknown }).error;
    if (typeof error === "string" && error !== "") return error;
    if (typeof error === "object" && error !== null) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message !== "") return message;
    }
    return null;
  } catch {
    return null;
  }
}
