import {
  type GenerationId,
  type GenerationJobId,
  type GenerationVersionId,
  type IsoDateString,
  type JobFailure,
  type ProjectId,
  type SceneId,
} from "@/types";
import { type ActualCost } from "@/types/money";

/**
 * Live queue vocabulary — what the UI renders while a generation moves
 * through the pipeline. Distinct from the persisted `GenerationJobStatus`:
 * "downloading" is a real phase the user watches, but on disk a job simply
 * stays `running` until its artifact is safely attached (crash-safe resume).
 */

export type GenerationPhase =
  "queued" | "generating" | "downloading" | "completed" | "failed" | "canceled";

export const TERMINAL_PHASES: ReadonlySet<GenerationPhase> = new Set([
  "completed",
  "failed",
  "canceled",
]);

/** One tracked generation: ids to resolve context plus live progress. */
export interface GenerationTask {
  jobId: GenerationJobId;
  versionId: GenerationVersionId;
  generationId: GenerationId;
  sceneId: SceneId;
  projectId: ProjectId;
  /** Version number ("V3") for display without a repository roundtrip. */
  versionNumber: number;
  phase: GenerationPhase;
  /** 0–1 when the provider reports progress; null otherwise (no fakes). */
  progress: number | null;
  failure: JobFailure | null;
  /** Actual cost, once the provider reports usage. */
  actualCost: ActualCost | null;
  enqueuedAt: IsoDateString;
  updatedAt: IsoDateString;
}

/** Fired on every task change; consumers invalidate caches from it. */
export interface QueueEvent {
  task: GenerationTask;
}
