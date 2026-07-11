import {
  type CreditsDto,
  type KeyInfoDto,
  type VideoJobDto,
  type VideoModelDto,
} from "@/services/openrouter/dto";
import { nowIso, type IsoDateString } from "@/types";

import {
  type AccountStatus,
  type PerSecondPrice,
  type PerTokenPrice,
  type ProviderGenerationJob,
  type ProviderJobStatus,
  type VideoModel,
  type VideoModelCapabilities,
  type VideoModelPricing,
} from "../types";

/**
 * DTO → domain mapping for OpenRouter.
 *
 * The single place where OpenRouter's wire vocabulary is translated into
 * the app's vocabulary. If OpenRouter renames a field tomorrow, this file
 * (plus the zod schema) is the entire blast radius.
 */

const USD = "USD";

function toMoney(amount: number | null | undefined): { amount: number; currency: string } | null {
  return amount === null || amount === undefined ? null : { amount, currency: USD };
}

export function mapAccountStatus(key: KeyInfoDto, credits: CreditsDto | null): AccountStatus {
  return {
    keyLabel: key.label ?? null,
    isFreeTier: key.is_free_tier ?? null,
    balance:
      credits === null ? null : toMoney(Math.max(0, credits.total_credits - credits.total_usage)),
    usage: toMoney(credits?.total_usage ?? key.usage),
    limit: toMoney(key.limit),
  };
}

/* ------------------------------------------------------------------ */
/* Video model catalog                                                 */
/* ------------------------------------------------------------------ */

function parsePrice(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Parses one pricing SKU key into a per-second price, or null when the SKU
 * is not per-second (image inputs, token-based pricing, …).
 *
 * Observed catalog patterns:
 *   duration_seconds                        → flat USD/s
 *   duration_seconds_720p                   → USD/s at 720p
 *   duration_seconds_with_audio_4k          → USD/s, audio on, 4K
 *   text_to_video_duration_seconds_480p     → USD/s, text→video, 480p
 *   image_to_video_duration_seconds_1080p   → USD/s, image→video, 1080p
 *   cents_per_video_output_second_720p      → ¢/s at 720p
 *   video_tokens / video_tokens_without_audio → USD per video token (Seedance)
 */
function parsePerSecondSku(key: string, value: number): PerSecondPrice | null {
  let rest: string;
  let usdPerSecond: number;

  const cents = /^cents_per_video_output_second(?:_(.+))?$/.exec(key);
  const dollars = /^(?:(text_to_video|image_to_video)_)?duration_seconds(?:_(.+))?$/.exec(key);
  let mode: PerSecondPrice["mode"] = null;

  if (cents !== null) {
    usdPerSecond = value / 100;
    rest = cents[1] ?? "";
  } else if (dollars !== null) {
    usdPerSecond = value;
    mode =
      dollars[1] === "text_to_video"
        ? "text-to-video"
        : dollars[1] === "image_to_video"
          ? "image-to-video"
          : null;
    rest = dollars[2] ?? "";
  } else {
    return null;
  }

  let audio: boolean | null = null;
  if (rest.startsWith("with_audio")) {
    audio = true;
    rest = rest.slice("with_audio".length).replace(/^_/, "");
  } else if (rest.startsWith("without_audio")) {
    audio = false;
    rest = rest.slice("without_audio".length).replace(/^_/, "");
  }

  return { usdPerSecond, resolution: rest === "" ? null : rest.toLowerCase(), audio, mode };
}

/**
 * Parses one pricing SKU key into a per-video-token price (Seedance-style
 * token billing), or null when the SKU is not token-based.
 */
function parsePerTokenSku(key: string, value: number): PerTokenPrice | null {
  const match = /^video_tokens(?:_(with|without)_audio)?$/.exec(key);
  if (match === null) return null;
  const audio = match[1] === "with" ? true : match[1] === "without" ? false : null;
  return { usdPerToken: value, audio };
}

function mapPricing(dto: VideoModelDto): VideoModelPricing {
  const raw = dto.pricing_skus ?? {};
  const perSecond: PerSecondPrice[] = [];
  const perToken: PerTokenPrice[] = [];
  let perRequestUsd: number | null = null;

  for (const [key, rawValue] of Object.entries(raw)) {
    const value = parsePrice(rawValue);
    if (value === null) continue;
    if (key === "request" || key === "per_request") {
      perRequestUsd = value;
      continue;
    }
    const secondPrice = parsePerSecondSku(key, value);
    if (secondPrice !== null) {
      perSecond.push(secondPrice);
      continue;
    }
    const tokenPrice = parsePerTokenSku(key, value);
    if (tokenPrice !== null) perToken.push(tokenPrice);
  }

  return { perRequestUsd, perSecond, perToken, raw };
}

/** Numeric rank for sorting resolution labels ("480p" < "720p" < "4K"). */
function resolutionRank(label: string): number {
  const p = /^(\d{3,4})p$/i.exec(label);
  if (p?.[1] !== undefined) return Number.parseInt(p[1], 10);
  const k = /^(\d+)k$/i.exec(label);
  if (k?.[1] !== undefined) return Number.parseInt(k[1], 10) * 540; // 4K ≈ 2160
  return Number.MAX_SAFE_INTEGER;
}

/**
 * Resolutions the pricing table proves the model accepts. Some catalog
 * entries under-report `supported_resolutions` (Kling v3.0 lists only 720p
 * while publishing 480p/720p/1080p SKUs), so the union of both signals is
 * the truthful answer. Pricing SKUs are provider metadata, not guesses.
 */
function skuResolutions(dto: VideoModelDto): string[] {
  const found = new Set<string>();
  for (const key of Object.keys(dto.pricing_skus ?? {})) {
    const match = /(?:^|_)(\d{3,4}p)(?:_|$)/i.exec(key);
    if (match?.[1] !== undefined) found.add(match[1].toLowerCase());
  }
  return [...found];
}

function mapResolutions(dto: VideoModelDto): string[] | null {
  const listed = dto.supported_resolutions ?? [];
  const fromSkus = skuResolutions(dto);
  if (listed.length === 0 && fromSkus.length === 0) return null;
  const merged = new Set<string>(listed);
  for (const res of fromSkus) {
    // Case-insensitive de-dupe: "720P" and "720p" are the same resolution.
    if (![...merged].some((existing) => existing.toLowerCase() === res)) merged.add(res);
  }
  return [...merged].sort((a, b) => resolutionRank(a) - resolutionRank(b));
}

/**
 * The provider's own name for the negative prompt passthrough parameter
 * (Kling/Wan `negative_prompt`, Veo `negativePrompt`), or null when the
 * model lists none. This exact string must be used as the parameter key.
 */
export function negativePromptParamName(dto: VideoModelDto): string | null {
  const passthrough = dto.allowed_passthrough_parameters ?? [];
  return passthrough.find((param) => /^negative[_-]?prompt$/i.test(param)) ?? null;
}

/** Negative prompt support, read from the passthrough parameter list.
 * Absence of the list means "not reported". */
function mapNegativePrompt(dto: VideoModelDto): boolean | null {
  const passthrough = dto.allowed_passthrough_parameters;
  if (passthrough === null || passthrough === undefined) return null;
  return negativePromptParamName(dto) !== null;
}

function mapCapabilities(dto: VideoModelDto): VideoModelCapabilities {
  const frameImages = dto.supported_frame_images ?? [];
  return {
    // Every model in the video catalog is prompted with text.
    textToVideo: true,
    imageToVideo: frameImages.includes("first_frame"),
    endFrame: frameImages.includes("last_frame"),
    // The video API does not (yet) accept video input.
    extendVideo: false,
    audio: dto.generate_audio ?? null,
    seed: dto.seed ?? null,
    negativePrompt: mapNegativePrompt(dto),
    durationsSeconds: dto.supported_durations ?? null,
    resolutions: mapResolutions(dto),
    aspectRatios: dto.supported_aspect_ratios ?? null,
  };
}

export function mapVideoModel(dto: VideoModelDto): VideoModel {
  return {
    id: dto.id,
    providerId: "openrouter",
    name: dto.name ?? dto.id,
    description: dto.description ?? "",
    capabilities: mapCapabilities(dto),
    pricing: mapPricing(dto),
    releasedAt:
      dto.created === null || dto.created === undefined
        ? null
        : (new Date(dto.created * 1000).toISOString() as IsoDateString),
  };
}

/* ------------------------------------------------------------------ */
/* Video jobs                                                          */
/* ------------------------------------------------------------------ */

/** Wire statuses → the provider-contract vocabulary. Unknown = running. */
function mapJobStatus(status: string): ProviderJobStatus {
  switch (status) {
    case "pending":
      return "queued";
    case "in_progress":
    case "processing":
    case "running":
      return "running";
    case "completed":
      return "succeeded";
    case "failed":
    case "expired":
      return "failed";
    case "cancelled":
    case "canceled":
      return "canceled";
    default:
      // A status added on OpenRouter's side must not crash polling; treat
      // it as still-running so the poll loop keeps watching the job.
      return "running";
  }
}

function errorMessage(dto: VideoJobDto): string | null {
  if (typeof dto.error === "string" && dto.error !== "") return dto.error;
  if (typeof dto.error === "object" && dto.error !== null) {
    const message = dto.error.message;
    if (typeof message === "string" && message !== "") return message;
  }
  if (dto.status === "expired") return "The provider expired the job before it finished.";
  return null;
}

export function mapVideoJob(dto: VideoJobDto): ProviderGenerationJob {
  const status = mapJobStatus(dto.status);
  return {
    id: dto.id,
    providerId: "openrouter",
    status,
    // OpenRouter reports no numeric progress — null, never invented.
    progress: null,
    outputUrl: dto.unsigned_urls?.[0] ?? null,
    failureReason: status === "failed" || status === "canceled" ? errorMessage(dto) : null,
    costUsd: dto.usage?.cost ?? null,
    createdAt: nowIso(),
  };
}
