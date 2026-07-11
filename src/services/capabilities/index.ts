import { type VideoModel } from "@/services/providers";

/**
 * Capability Registry — the single translation layer between "what a model
 * reports" and "what the UI offers".
 *
 * Every screen that shows or hides a generation feature asks this module,
 * never `model.capabilities` directly. Two independent gates feed each
 * answer:
 *
 *   1. Model support — collected dynamically from provider metadata.
 *   2. App readiness — which capabilities this build can deliver
 *      end-to-end (`APP_READY`). A model may advertise end-frame guidance
 *      before Little Studio can send it; the registry keeps the UI honest
 *      about both sides.
 *
 * Unavailability is expressed as a typed `CapabilityReason`, never prose —
 * the UI renders it through the i18n layer in the active language.
 *
 * Adding a capability for a future provider = extend `CapabilityId` and
 * `modelSupport()`. No UI rewiring.
 */

export type CapabilityId =
  | "text-to-video"
  | "image-to-video"
  | "start-image"
  | "end-image"
  | "extend"
  | "loop"
  | "negative-prompt"
  | "camera-controls"
  | "motion-brush"
  | "character-reference"
  | "style-reference"
  | "seed"
  | "duration"
  | "aspect-ratio"
  | "resolution"
  | "audio";

/** Why a capability is unavailable — typed, translated by the UI layer. */
export type CapabilityReason =
  | { kind: "choose-model" }
  | { kind: "not-supported"; model: string; capability: CapabilityId }
  | { kind: "not-reported"; model: string; capability: CapabilityId }
  | { kind: "coming-soon" };

/** One capability, answered for one concrete model (or none). */
export interface CapabilityState {
  /** True when the feature works end-to-end in this build for this model. */
  enabled: boolean;
  /** Why it is unavailable. Null when enabled. */
  reason: CapabilityReason | null;
}

export type CapabilityProfile = Readonly<Record<CapabilityId, CapabilityState>>;

export const ALL_CAPABILITIES: readonly CapabilityId[] = [
  "text-to-video",
  "image-to-video",
  "start-image",
  "end-image",
  "extend",
  "loop",
  "negative-prompt",
  "camera-controls",
  "motion-brush",
  "character-reference",
  "style-reference",
  "seed",
  "duration",
  "aspect-ratio",
  "resolution",
  "audio",
];

/** Capabilities this build can deliver end-to-end today. Everything else
 * stays visible-but-locked until the pipeline learns to send it. */
const APP_READY: ReadonlySet<CapabilityId> = new Set<CapabilityId>([
  "text-to-video",
  "image-to-video",
  "start-image",
  "end-image",
  "negative-prompt",
  "seed",
  "duration",
  "aspect-ratio",
  "resolution",
  "audio",
]);

/** What the model itself reports: true / false / null (= not reported). */
function modelSupport(model: VideoModel, id: CapabilityId): boolean | null {
  const caps = model.capabilities;
  switch (id) {
    case "text-to-video":
      return caps.textToVideo;
    case "image-to-video":
    case "start-image":
      return caps.imageToVideo;
    case "end-image":
      return caps.endFrame;
    case "extend":
      return caps.extendVideo;
    case "seed":
      return caps.seed;
    case "audio":
      return caps.audio;
    case "duration":
      return caps.durationsSeconds === null ? null : true;
    case "resolution":
      return caps.resolutions === null ? null : true;
    case "aspect-ratio":
      return caps.aspectRatios === null ? null : true;
    case "negative-prompt":
      return caps.negativePrompt;
    // No connected provider reports these yet.
    case "loop":
    case "camera-controls":
    case "motion-brush":
    case "character-reference":
    case "style-reference":
      return null;
  }
}

/**
 * What the model itself reports for one capability — the single read
 * point for every "does this model support X?" question in the UI
 * (chips, badges, frame slots). `null` = the provider does not say.
 * For "can the user actually use X right now?" use `resolveCapabilities`,
 * which also applies app readiness.
 */
export function modelSupports(model: VideoModel, id: CapabilityId): boolean | null {
  return modelSupport(model, id);
}

/** Capabilities where "not reported" must behave as "don't send / hide"
 * (sending an unreported parameter risks rejecting a paid request). */
const STRICT_WHEN_UNKNOWN: ReadonlySet<CapabilityId> = new Set<CapabilityId>([
  "seed",
  "audio",
  "negative-prompt",
]);

function resolveOne(model: VideoModel | null, id: CapabilityId): CapabilityState {
  // Roadmap features stay "coming soon" no matter which model is selected —
  // a model saying "no" is still worth naming, but a missing model is not.
  if (!APP_READY.has(id)) {
    if (model !== null && modelSupport(model, id) === false) {
      return {
        enabled: false,
        reason: { kind: "not-supported", model: model.name, capability: id },
      };
    }
    return { enabled: false, reason: { kind: "coming-soon" } };
  }

  if (model === null) return { enabled: false, reason: { kind: "choose-model" } };

  const support = modelSupport(model, id);
  if (support === false) {
    return { enabled: false, reason: { kind: "not-supported", model: model.name, capability: id } };
  }
  if (support === null && STRICT_WHEN_UNKNOWN.has(id)) {
    return { enabled: false, reason: { kind: "not-reported", model: model.name, capability: id } };
  }
  return { enabled: true, reason: null };
}

/** The full capability answer for one model. Cheap enough to derive per
 * render; no caching, no staleness. */
export function resolveCapabilities(model: VideoModel | null): CapabilityProfile {
  const profile = {} as Record<CapabilityId, CapabilityState>;
  for (const id of ALL_CAPABILITIES) profile[id] = resolveOne(model, id);
  return profile;
}

/* ------------------------------------------------------------------ */
/* Generation modes                                                    */
/* ------------------------------------------------------------------ */

/** The creative entry points into a generation. A mode is a bundle of
 * capabilities the model (and this build) must satisfy together. */
export type GenerationMode = "text-to-video" | "image-to-video" | "start-end" | "extend" | "loop";

export const GENERATION_MODES: readonly GenerationMode[] = [
  "text-to-video",
  "image-to-video",
  "start-end",
  "extend",
  "loop",
];

const modeRequirements: Record<GenerationMode, readonly CapabilityId[]> = {
  "text-to-video": ["text-to-video"],
  "image-to-video": ["image-to-video"],
  "start-end": ["image-to-video", "end-image"],
  extend: ["extend"],
  loop: ["loop"],
};

/** Whether a mode can be entered with the given profile — and if not, the
 * first typed reason why. */
export function modeAvailability(
  profile: CapabilityProfile,
  mode: GenerationMode,
): CapabilityState {
  for (const requirement of modeRequirements[mode]) {
    const state = profile[requirement];
    if (!state.enabled) return state;
  }
  return { enabled: true, reason: null };
}
