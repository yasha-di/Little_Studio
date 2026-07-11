import { type IsoDateString } from "@/types";
import { type Money } from "@/types/money";

/**
 * Provider abstraction for AI video generation.
 *
 * The UI and stores depend exclusively on these interfaces — never on a
 * concrete provider. OpenRouter is the first implementation, but nothing
 * outside `services/providers` may know that it exists. Adding a second
 * provider (Replicate, fal.ai, a local model, …) means implementing
 * `VideoGenerationProvider` and registering it; zero UI changes.
 */

export type ProviderId = "openrouter";

export interface ProviderInfo {
  id: ProviderId;
  /** Human-readable name, e.g. "OpenRouter". */
  name: string;
  /** Base URL of the provider's dashboard, for outbound links. */
  websiteUrl: string;
}

/**
 * What a model can do. Collected dynamically from provider metadata — never
 * hardcoded. `null` means "the provider does not report this"; the UI must
 * treat null as unknown, not as unsupported. Future forms build themselves
 * from this structure.
 */
export interface VideoModelCapabilities {
  textToVideo: boolean;
  imageToVideo: boolean;
  /** Model accepts an end-frame image (guides the last frame). */
  endFrame: boolean;
  /** Model accepts video input (extend / video-to-video workflows). */
  extendVideo: boolean;
  /** Model produces audio along with video. `null` = not reported. */
  audio: boolean | null;
  /** Model accepts a fixed seed. `null` = not reported. */
  seed: boolean | null;
  /** Model accepts a negative prompt (via passthrough). `null` = not reported. */
  negativePrompt: boolean | null;
  durationsSeconds: number[] | null;
  resolutions: string[] | null;
  aspectRatios: string[] | null;
}

/**
 * One published per-second price. Providers price by resolution, audio and
 * generation mode; dimensions the SKU does not constrain are `null`
 * ("applies regardless").
 */
export interface PerSecondPrice {
  usdPerSecond: number;
  resolution: string | null;
  audio: boolean | null;
  mode: "text-to-video" | "image-to-video" | null;
}

/**
 * One published per-video-token price (Seedance-style). OpenRouter documents
 * the token count as `width × height × fps(24) × durationSeconds / 1024`,
 * so a USD estimate needs the output dimensions to be known.
 */
export interface PerTokenPrice {
  usdPerToken: number;
  audio: boolean | null;
}

/** Normalized pricing signals extracted from provider metadata. */
export interface VideoModelPricing {
  /** Flat price per generation request, when published. */
  perRequestUsd: number | null;
  /** Per-second prices; empty when the provider publishes none we can read. */
  perSecond: readonly PerSecondPrice[];
  /** Per-video-token prices; empty when the model is not token-priced. */
  perToken: readonly PerTokenPrice[];
  /** Raw provider pricing table, preserved for diagnostics. */
  raw: Readonly<Record<string, string | number | null>>;
}

export interface VideoModel {
  /** Provider-scoped model identifier, e.g. "google/veo-3". */
  id: string;
  providerId: ProviderId;
  name: string;
  description: string;
  capabilities: VideoModelCapabilities;
  pricing: VideoModelPricing;
  releasedAt: IsoDateString | null;
}

export interface AccountStatus {
  /** User-assigned label of the API key, when the provider reports one. */
  keyLabel: string | null;
  isFreeTier: boolean | null;
  /** Remaining balance (credits minus usage). Null if not reported. */
  balance: Money | null;
  /** Lifetime spend on this key. */
  usage: Money | null;
  /** Hard spend limit configured for this key, if any. */
  limit: Money | null;
}

/**
 * Connection state machine, exposed to the UI. A discriminated union —
 * state-specific data (account, retry hints) only exists on the states
 * that actually have it, so the UI cannot render stale fields.
 */
export type ConnectionState =
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; account: AccountStatus }
  | { status: "invalid-key" }
  | { status: "offline" }
  | { status: "rate-limited"; retryAfterSeconds: number | null }
  | { status: "error"; message: string };

export type ConnectionStatus = ConnectionState["status"];

export interface VideoGenerationRequest {
  modelId: string;
  prompt: string;
  /** Only set when the model reports the capability (callers gate this);
   * providers translate it into their own wire format (OpenRouter:
   * per-provider passthrough parameter). */
  negativePrompt?: string;
  aspectRatio?: string;
  resolution?: string;
  durationSeconds?: number;
  seed?: number;
  /** Only sent when the model reports the capability (callers gate this). */
  generateAudio?: boolean;
  /** First-frame guidance image: https:// URL or base64 data URL. */
  startImageUrl?: string;
  /** Last-frame guidance image; only set when the model reports end-frame
   * support (callers gate this). */
  endImageUrl?: string;
}

export type ProviderJobStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";

/** Provider-side view of a generation job (mapped into domain `GenerationJob`). */
export interface ProviderGenerationJob {
  id: string;
  providerId: ProviderId;
  status: ProviderJobStatus;
  /** 0–1 when the provider reports progress, otherwise null. */
  progress: number | null;
  /** Download URL for the finished asset; null until `succeeded`. */
  outputUrl: string | null;
  failureReason: string | null;
  /** Actual cost in USD, when the provider reports usage. */
  costUsd: number | null;
  createdAt: IsoDateString;
}

/**
 * The contract every video generation provider must fulfil.
 * Methods return domain-shaped types, never raw wire formats — mapping
 * happens inside the provider implementation.
 */
export interface VideoGenerationProvider {
  readonly info: ProviderInfo;

  /** Verifies credentials and returns account state + balance. */
  getAccountStatus(): Promise<AccountStatus>;

  /** Video-capable models currently available to this account. */
  listModels(): Promise<VideoModel[]>;

  /** Starts a generation and returns the job handle for polling. */
  createGeneration(request: VideoGenerationRequest): Promise<ProviderGenerationJob>;

  /** Fetches the current state of a previously created job. */
  getGeneration(jobId: string): Promise<ProviderGenerationJob>;

  /** Downloads the finished video as a binary blob. */
  downloadResult(jobId: string): Promise<Blob>;

  /**
   * Cancels a queued or running job. Providers without a cancel API reject
   * with `NotImplementedError`; callers treat that as "cancel locally".
   */
  cancelGeneration(jobId: string): Promise<void>;
}
