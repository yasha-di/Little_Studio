import { type IsoDateString } from "../common";
import { type ActualCost, type CostEstimate } from "../money";
import { type GenerationJobId, type GenerationVersionId } from "./ids";

/**
 * Execution layer: jobs and results.
 *
 * A `GenerationJob` is the mutable record of one provider execution —
 * status, progress, cost and timing evolve while it runs. When it succeeds
 * it produces an immutable `GenerationResult`. Versions stay immutable
 * because everything that changes over time lives here instead.
 */

export type GenerationJobStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";

/** Terminal statuses — a job in one of these will never change again. */
export const TERMINAL_JOB_STATUSES: ReadonlySet<GenerationJobStatus> = new Set([
  "succeeded",
  "failed",
  "canceled",
]);

export interface JobTiming {
  queuedAt: IsoDateString;
  startedAt: IsoDateString | null;
  finishedAt: IsoDateString | null;
  /** Wall-clock provider generation time, when reported. */
  generationTimeMs: number | null;
}

export interface JobCost {
  estimate: CostEstimate;
  /** Populated from provider usage data after completion. */
  actual: ActualCost | null;
}

export interface JobFailure {
  /** Stable error code from the error hierarchy (e.g. "RATE_LIMITED"). */
  code: string;
  message: string;
  retryable: boolean;
}

export interface GenerationJob {
  id: GenerationJobId;
  versionId: GenerationVersionId;
  providerId: string;
  /** The provider's own job identifier, once acknowledged. */
  providerJobId: string | null;
  status: GenerationJobStatus;
  /** 0–1 when the provider reports progress; null otherwise. */
  progress: number | null;
  cost: JobCost;
  timing: JobTiming;
  failure: JobFailure | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/** Immutable artifact produced by a succeeded job. */
export interface GenerationResult {
  versionId: GenerationVersionId;
  /** Remote URL as returned by the provider (may expire). */
  videoUrl: string;
  /** Local copy once downloaded into the media library. */
  localPath: string | null;
  thumbnailPath: string | null;
  durationSeconds: number | null;
  resolution: string | null;
  fileSizeBytes: number | null;
  mimeType: string;
  createdAt: IsoDateString;
}
