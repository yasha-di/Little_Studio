import { z } from "zod";

/**
 * OpenRouter wire formats (DTOs), validated with zod.
 *
 * Every response is parsed before it may cross into the app: a schema
 * change on OpenRouter's side surfaces as a single, loggable
 * `ValidationError` at the boundary instead of `undefined` bleeding
 * through the UI. Schemas are deliberately tolerant (`nullish`, passthrough
 * of unknown keys) — we validate what we consume, not their whole API.
 */

/** GET /api/v1/key — metadata about the presented API key. */
export const keyInfoResponseSchema = z.object({
  data: z.object({
    label: z.string().nullish(),
    usage: z.number().nullish(),
    limit: z.number().nullish(),
    limit_remaining: z.number().nullish(),
    is_free_tier: z.boolean().nullish(),
  }),
});
export type KeyInfoDto = z.infer<typeof keyInfoResponseSchema>["data"];

/** GET /api/v1/credits — lifetime purchased credits and usage (USD). */
export const creditsResponseSchema = z.object({
  data: z.object({
    total_credits: z.number(),
    total_usage: z.number(),
  }),
});
export type CreditsDto = z.infer<typeof creditsResponseSchema>["data"];

/**
 * One entry of GET /api/v1/videos/models — the dedicated video generation
 * catalog. Capability constraints (durations, resolutions, aspect ratios,
 * frame image slots, audio, seed) are first-class fields here, which is
 * exactly what lets the UI build itself from provider data.
 */
export const videoModelSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  created: z.number().nullish(),
  supported_resolutions: z.array(z.string()).nullish(),
  supported_aspect_ratios: z.array(z.string()).nullish(),
  supported_durations: z.array(z.number()).nullish(),
  /** Allowed `frame_type` values for frame_images ("first_frame", "last_frame"). */
  supported_frame_images: z.array(z.string()).nullish(),
  /** true/false = capability reported; null = the provider does not say. */
  generate_audio: z.boolean().nullish(),
  seed: z.boolean().nullish(),
  /** Price table keyed by SKU ("duration_seconds_720p" → "0.0988" USD/s). */
  pricing_skus: z.record(z.string(), z.union([z.string(), z.number()]).nullable()).nullish(),
  /** Extra request parameters OpenRouter forwards to this model verbatim
   * (e.g. "negative_prompt", "cfg_scale"). Absent = not reported. */
  allowed_passthrough_parameters: z.array(z.string()).nullish(),
});
export type VideoModelDto = z.infer<typeof videoModelSchema>;

/**
 * The list endpoint: items are validated individually by the client so one
 * malformed model degrades to a logged warning, not a broken model list.
 */
export const videoModelsResponseSchema = z.object({
  data: z.array(z.unknown()),
});

/** Outgoing body of POST /api/v1/videos. Optional keys are omitted, not null. */
export interface VideoJobRequestDto {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  seed?: number;
  generate_audio?: boolean;
  frame_images?: {
    type: "image_url";
    image_url: { url: string };
    frame_type: "first_frame" | "last_frame";
  }[];
  /** Provider passthrough: `options.<provider slug>.parameters.<param>`.
   * Only the options for the provider that actually serves the request are
   * forwarded, so keying every known slug of a model is safe. */
  provider?: {
    options: Record<string, { parameters: Record<string, string> }>;
  };
}

/**
 * GET /api/v1/models/{author}/{slug}/endpoints — where a model's serving
 * providers are listed. `tag` is the provider slug that passthrough
 * parameters must be keyed by (e.g. "google-vertex", "atlas-cloud").
 */
export const modelEndpointsResponseSchema = z.object({
  data: z.object({
    endpoints: z.array(z.object({ tag: z.string() }).loose()),
  }),
});

/**
 * POST /api/v1/videos and GET /api/v1/videos/{id} both return the job.
 * `status` is kept as a free string and normalized in the mapping layer —
 * OpenRouter may add statuses and an unknown one must degrade gracefully.
 */
export const videoJobSchema = z.object({
  id: z.string(),
  status: z.string(),
  polling_url: z.string().nullish(),
  /** Signed download URLs, present once the job completed. May expire. */
  unsigned_urls: z.array(z.string()).nullish(),
  /** Failure detail; observed both as a string and as an object. */
  error: z.union([z.string(), z.object({ message: z.string().nullish() }).loose()]).nullish(),
  usage: z.object({ cost: z.number().nullish() }).loose().nullish(),
});
export type VideoJobDto = z.infer<typeof videoJobSchema>;
