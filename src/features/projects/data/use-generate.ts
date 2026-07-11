import * as React from "react";

import { capabilityReasonText } from "@/hooks/use-capability-text";
import { useSceneTask } from "@/hooks/use-generation-queue";
import { useOpenRouterConnection, useVideoModels } from "@/hooks/use-openrouter";
import { useT } from "@/i18n";
import {
  modeAvailability,
  resolveCapabilities,
  type CapabilityProfile,
  type GenerationMode,
} from "@/services/capabilities";
import { generationQueue, TERMINAL_PHASES, type GenerationTask } from "@/services/generation";
import { type VideoModel } from "@/services/providers";
import { type GenerationVersionId, type Scene } from "@/types";

import { useSceneGenerations } from "./use-generations";

/** What currently stands between the user and their next take. The
 * composer turns each code into a concrete "do this next" suggestion. */
export type GenerateBlocker =
  | "connect-provider"
  | "loading-models"
  | "choose-model"
  | "mode-unavailable"
  | "no-extend-source"
  | "choose-extend-source"
  | "add-start-image"
  | "add-end-image"
  | "write-prompt"
  | "busy";

/** The creative intent of the next generation, chosen in the workspace. */
export interface GenerationIntent {
  mode: GenerationMode;
  /** Which take Extend mode continues from; null when none is chosen. */
  extendSourceId: GenerationVersionId | null;
}

/**
 * Everything the workspace needs to run a generation for one scene:
 * readiness validation (with the exact reason the button is disabled),
 * the live task to render progress from, and the trigger/cancel actions.
 */
export interface GenerateControl {
  /** Null when generation can start; otherwise the human-readable blocker. */
  disabledReason: string | null;
  /** Machine-readable counterpart of `disabledReason` for guided hints. */
  blocker: GenerateBlocker | null;
  /** The live task — phases, failure, actual cost. */
  task: GenerationTask | null;
  /** True while this scene has a non-terminal task in the queue. */
  isBusy: boolean;
  model: VideoModel | null;
  /** Capability answers for the selected model — one source for all UI. */
  capabilities: CapabilityProfile;
  generate: () => void;
  cancel: () => void;
}

export function useGenerateControl(
  draft: Scene,
  flushDraft: () => void,
  intent: GenerationIntent,
): GenerateControl {
  const t = useT();
  const connection = useOpenRouterConnection();
  const models = useVideoModels();
  const task = useSceneTask(draft.id);
  const generations = useSceneGenerations(draft.id);

  const model = models.data?.find((m) => m.id === draft.generation.modelId) ?? null;
  const capabilities = resolveCapabilities(model);
  const isBusy = task !== null && !TERMINAL_PHASES.has(task.phase);
  const takeCount = generations.data?.[0]?.versions.length ?? 0;

  let disabledReason: string | null = null;
  let blocker: GenerateBlocker | null = null;

  const mode = modeAvailability(capabilities, intent.mode);

  if (connection.status !== "connected") {
    disabledReason = t("blocker.connect");
    blocker = "connect-provider";
  } else if (models.isPending) {
    disabledReason = t("blocker.loadingModels");
    blocker = "loading-models";
  } else if (model === null) {
    disabledReason = t("blocker.chooseModel");
    blocker = "choose-model";
  } else if (!mode.enabled) {
    disabledReason =
      mode.reason === null ? t("blocker.modeUnavailable") : capabilityReasonText(t, mode.reason);
    blocker = "mode-unavailable";
  } else if (intent.mode === "extend" && takeCount === 0) {
    disabledReason = t("blocker.noExtendSource");
    blocker = "no-extend-source";
  } else if (intent.mode === "extend" && intent.extendSourceId === null) {
    disabledReason = t("blocker.chooseExtendSource");
    blocker = "choose-extend-source";
  } else if (
    (intent.mode === "image-to-video" || intent.mode === "start-end") &&
    draft.startImageId === null
  ) {
    disabledReason = t("blocker.addStartImage");
    blocker = "add-start-image";
  } else if (intent.mode === "start-end" && draft.endImageId === null) {
    disabledReason = t("blocker.addEndImage");
    blocker = "add-end-image";
  } else if (draft.prompt.text.trim() === "") {
    disabledReason = t("blocker.writePrompt");
    blocker = "write-prompt";
  } else if (isBusy) {
    disabledReason = t("blocker.busy");
    blocker = "busy";
  }

  const generate = React.useCallback(() => {
    if (disabledReason !== null || model === null) return;
    // Persist the draft the user is looking at, then snapshot exactly it.
    flushDraft();
    void generationQueue.enqueue({ scene: draft, model, mode: intent.mode });
  }, [disabledReason, model, flushDraft, draft, intent.mode]);

  const cancel = React.useCallback(() => {
    if (task !== null && !TERMINAL_PHASES.has(task.phase)) {
      void generationQueue.cancel(task.jobId);
    }
  }, [task]);

  return { disabledReason, blocker, task, isBusy, model, capabilities, generate, cancel };
}
