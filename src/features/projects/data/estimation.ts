import { modelSupports, type GenerationMode } from "@/services/capabilities";
import { type EstimationInput } from "@/services/pricing";
import { type VideoModel } from "@/services/providers";
import { type Scene } from "@/types";

/**
 * The one way the workspace turns a draft + generation mode into pricing
 * input. The Inspector, the status bar and the per-option price hints all
 * derive from this, so they can never disagree about what the selected
 * configuration costs. (The queue prices the final payload itself — same
 * SKU rules, gated by what is actually sent.)
 */
export function draftEstimationInput(
  draft: Scene,
  model: VideoModel,
  mode: GenerationMode,
): EstimationInput {
  const generation = draft.generation;
  return {
    model,
    durationSeconds: generation.durationSeconds,
    resolution: generation.resolution,
    aspectRatio: generation.aspectRatio,
    // Only price audio the model can actually deliver (matches the payload).
    generateAudio: modelSupports(model, "audio") === true ? generation.generateAudio : null,
    mode:
      (mode === "image-to-video" || mode === "start-end") &&
      draft.startImageId !== null &&
      modelSupports(model, "image-to-video") === true
        ? "image-to-video"
        : "text-to-video",
  };
}
