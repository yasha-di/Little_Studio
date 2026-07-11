import { type IsoDateString } from "../common";
import {
  type GenerationId,
  type GenerationJobId,
  type GenerationVersionId,
  type ReferenceImageId,
  type SceneId,
} from "./ids";
import { type PromptSnapshot } from "./prompt";

/**
 * Generation & version tree — the core creative structure of the app.
 *
 * A `Generation` is one creative intent inside a scene ("the dragon takes
 * off"). Each attempt at realizing it is a `GenerationVersion`. Versions
 * form a tree exactly like git commits: every version points at its parent,
 * children are derived, and different branches represent different creative
 * directions (remix vs extend vs regenerate).
 *
 * Deliberate constraints:
 * - Versions are IMMUTABLE once created. Prompt/settings are stored as
 *   snapshots by value; editing a prompt later cannot rewrite history.
 * - Parent links are the single source of truth. Child arrays are computed
 *   by `lib/version-tree` — storing both would eventually disagree.
 * - A version references its execution (`jobId`) and outcome (`resultId`)
 *   rather than embedding them: jobs are mutable while they run, results
 *   are large — both live in their own stores.
 */

export type VersionOperation =
  /** First version of a generation. Has no parent. */
  | "initial"
  /** Same prompt & settings, new sampling (new seed). */
  | "regenerate"
  /** Modified prompt/settings branching from the parent. */
  | "remix"
  /** Continues the parent's video from its last frame. */
  | "extend";

export interface GenerationSettings {
  /** Provider-scoped model identifier, e.g. "google/veo-3". */
  modelId: string;
  durationSeconds: number | null;
  resolution: string | null;
  aspectRatio: string | null;
  seed: number | null;
  /** Audio flag as sent to the provider; null = model does not support it. */
  generateAudio: boolean | null;
  /** Negative prompt as sent to the provider; null = unsupported or empty.
   * (The creative draft text always lives in the prompt snapshot.)
   * Absent on records persisted before V0.31 — read with `?? null`. */
  negativePrompt: string | null;
  /** Frame guidance captured at creation time. */
  startImageId: ReferenceImageId | null;
  endImageId: ReferenceImageId | null;
}

export interface GenerationVersion {
  id: GenerationVersionId;
  generationId: GenerationId;
  /** `null` only for the root ("initial") version. */
  parentId: GenerationVersionId | null;
  operation: VersionOperation;
  /** Monotonic per-generation number for display ("v3"). */
  number: number;
  /** Optional user-given name ("hero take", "slower camera"). */
  label: string | null;
  prompt: PromptSnapshot;
  settings: GenerationSettings;
  /** The job that executed (or is executing) this version. */
  jobId: GenerationJobId | null;
  createdAt: IsoDateString;
}

export interface Generation {
  id: GenerationId;
  sceneId: SceneId;
  /** Creative intent, shown as the node title in the tree UI. */
  title: string;
  /** Root of the version tree; null until the first version is created. */
  rootVersionId: GenerationVersionId | null;
  /** The version currently "picked" as this generation's face. */
  activeVersionId: GenerationVersionId | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}
