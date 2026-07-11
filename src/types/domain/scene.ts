import { type IsoDateString } from "../common";
import { type ProjectId, type ReferenceImageId, type SceneId } from "./ids";
import { type PromptContent } from "./prompt";

/**
 * Scene — an ordered narrative unit inside a project.
 *
 * A scene carries its *living* creative draft: the prompt being written,
 * the generation settings being tuned, guidance frames, loop intent.
 * Generating snapshots this draft into an immutable `GenerationVersion` —
 * the scene keeps evolving, history never changes (same split as a working
 * directory vs. git commits).
 *
 * Loop Mode ships later, but the data model is loop-ready NOW so existing
 * scenes never need migration: a scene already knows its boundary frames
 * and loop intent. Start/end images also power the Extend workflow (the
 * next scene can start from this scene's last frame).
 */

export type LoopOptimization =
  /** Play the clip as generated; no seam treatment. */
  | "none"
  /** Ask the model to end near the start frame (seamless loop). */
  | "match-frames"
  /** Post-process crossfade between tail and head. */
  | "crossfade";

export interface SceneLoopConfig {
  enabled: boolean;
  optimization: LoopOptimization;
  /** Free-form intent ("must loop on the wing flap"), kept with the scene. */
  notes: string;
}

/**
 * The scene's draft generation settings — what the next generation will
 * use. Nullable fields mean "not chosen yet"; the UI must surface that
 * honestly instead of silently substituting defaults.
 */
export interface SceneGenerationDraft {
  /** Provider-scoped model identifier, e.g. "google/veo-3". */
  modelId: string | null;
  /** Arbitrary user-entered duration; validated against the model, never coerced. */
  durationSeconds: number | null;
  resolution: string | null;
  aspectRatio: string | null;
  /** Null = let the provider pick a random seed. */
  seed: number | null;
  generateAudio: boolean;
}

export interface Scene {
  id: SceneId;
  projectId: ProjectId;
  name: string;
  /** Position within the project (0-based, contiguous). */
  order: number;
  /** The living prompt draft (text, negative text, variables, metadata). */
  prompt: PromptContent;
  tags: string[];
  /** Style/subject reference images (distinct from boundary frames). */
  referenceImageIds: ReferenceImageId[];
  /** Guidance frames; also used by Loop and Extend workflows. */
  startImageId: ReferenceImageId | null;
  endImageId: ReferenceImageId | null;
  loop: SceneLoopConfig;
  generation: SceneGenerationDraft;
  notes: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}
