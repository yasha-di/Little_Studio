import { NotImplementedError } from "@/core/errors";
import { createLogger } from "@/core/logging";
import { type OpenRouterClient } from "@/services/openrouter/client";
import { type VideoJobRequestDto, type VideoModelDto } from "@/services/openrouter/dto";

import {
  type AccountStatus,
  type ProviderGenerationJob,
  type ProviderInfo,
  type VideoGenerationProvider,
  type VideoGenerationRequest,
  type VideoModel,
} from "../types";
import { mapAccountStatus, mapVideoJob, mapVideoModel, negativePromptParamName } from "./mapping";

const log = createLogger("openrouter.provider");

/**
 * OpenRouter implementation of `VideoGenerationProvider`.
 *
 * Composes the low-level `OpenRouterClient` (transport + DTOs) with the
 * mapping layer (DTO → domain). Everything is live: account, the video
 * model catalog and the full submit → poll → download job lifecycle.
 */
export class OpenRouterVideoProvider implements VideoGenerationProvider {
  readonly info: ProviderInfo = {
    id: "openrouter",
    name: "OpenRouter",
    websiteUrl: "https://openrouter.ai",
  };

  /** Raw catalog entries by model id — wire details (passthrough parameter
   * names) that the domain model deliberately does not carry. */
  private catalogDtos = new Map<string, VideoModelDto>();
  /** Provider slugs per model, fetched lazily to key passthrough options. */
  private readonly endpointTags = new Map<string, string[]>();

  constructor(private readonly client: OpenRouterClient) {}

  async getAccountStatus(): Promise<AccountStatus> {
    const key = await this.client.getKeyInfo();
    // Credits are secondary: a key without the credits scope should still
    // surface as "connected" with an unknown balance rather than failing.
    const credits = await this.client.getCredits().catch(() => null);
    return mapAccountStatus(key, credits);
  }

  async listModels(): Promise<VideoModel[]> {
    const models = await this.client.listVideoModels();
    this.catalogDtos = new Map(models.map((dto) => [dto.id, dto]));
    return models.map(mapVideoModel);
  }

  async createGeneration(request: VideoGenerationRequest): Promise<ProviderGenerationJob> {
    const frameImages: NonNullable<VideoJobRequestDto["frame_images"]> = [];
    if (request.startImageUrl !== undefined) {
      frameImages.push({
        type: "image_url",
        image_url: { url: request.startImageUrl },
        frame_type: "first_frame",
      });
    }
    if (request.endImageUrl !== undefined) {
      frameImages.push({
        type: "image_url",
        image_url: { url: request.endImageUrl },
        frame_type: "last_frame",
      });
    }

    const body: VideoJobRequestDto = {
      model: request.modelId,
      prompt: request.prompt,
      ...(request.durationSeconds !== undefined && { duration: request.durationSeconds }),
      ...(request.resolution !== undefined && { resolution: request.resolution }),
      ...(request.aspectRatio !== undefined && { aspect_ratio: request.aspectRatio }),
      ...(request.seed !== undefined && { seed: request.seed }),
      ...(request.generateAudio !== undefined && { generate_audio: request.generateAudio }),
      ...(frameImages.length > 0 && { frame_images: frameImages }),
    };

    if (request.negativePrompt !== undefined) {
      const passthrough = await this.negativePromptPassthrough(
        request.modelId,
        request.negativePrompt,
      );
      if (passthrough !== null) body.provider = passthrough;
    }

    const job = await this.client.createVideoJob(body);
    return mapVideoJob(job);
  }

  async getGeneration(jobId: string): Promise<ProviderGenerationJob> {
    const job = await this.client.getVideoJob(jobId);
    return mapVideoJob(job);
  }

  downloadResult(jobId: string): Promise<Blob> {
    return this.client.downloadVideoContent(jobId);
  }

  cancelGeneration(_jobId: string): Promise<void> {
    // OpenRouter's video API documents no cancel endpoint; the generation
    // queue cancels locally (stops polling) when it sees this rejection.
    return Promise.reject(new NotImplementedError("OpenRouter job cancellation"));
  }

  /**
   * OpenRouter has no first-class negative prompt field; supported models
   * take it as a passthrough parameter under the provider's own name
   * (`negative_prompt`, `negativePrompt`, …), keyed by provider slug.
   * Unresolvable wire details downgrade to "not sent" (logged) — an
   * auxiliary parameter must never fail a paid generation.
   */
  private async negativePromptPassthrough(
    modelId: string,
    text: string,
  ): Promise<NonNullable<VideoJobRequestDto["provider"]> | null> {
    try {
      const dto = await this.catalogEntry(modelId);
      const param = dto === undefined ? null : negativePromptParamName(dto);
      if (param === null) {
        log.warn("model lists no negative prompt parameter; skipping it", { modelId });
        return null;
      }
      const tags = await this.endpointTagsFor(modelId);
      if (tags.length === 0) {
        log.warn("model has no endpoint slugs; negative prompt not sent", { modelId });
        return null;
      }
      // Only the matched provider's options are forwarded, so keying every
      // slug that serves this model covers whichever one takes the request.
      return {
        options: Object.fromEntries(tags.map((tag) => [tag, { parameters: { [param]: text } }])),
      };
    } catch (error) {
      log.warn("could not resolve passthrough details; negative prompt not sent", {
        modelId,
        error,
      });
      return null;
    }
  }

  private async catalogEntry(modelId: string): Promise<VideoModelDto | undefined> {
    if (!this.catalogDtos.has(modelId)) await this.listModels();
    return this.catalogDtos.get(modelId);
  }

  private async endpointTagsFor(modelId: string): Promise<string[]> {
    const cached = this.endpointTags.get(modelId);
    if (cached !== undefined) return cached;
    const tags = await this.client.listModelEndpointTags(modelId);
    this.endpointTags.set(modelId, tags);
    return tags;
  }
}
