import { type ComponentProps } from "react";

import { type Badge } from "@/components/ui";
import { type MessageKey } from "@/i18n";
import { type GenerationPhase } from "@/services/generation";

/**
 * One shared mapping from queue phases to display vocabulary, so the
 * inspector, the take preview and the status bar can never disagree about
 * what "downloading" looks like. Labels are message keys — render them
 * through `t()`.
 */

export const phaseLabelKey: Record<GenerationPhase, MessageKey> = {
  queued: "phase.queued",
  generating: "phase.generating",
  downloading: "phase.downloading",
  completed: "phase.completed",
  failed: "phase.failed",
  canceled: "phase.canceled",
};

export const phaseBadgeVariant: Record<GenerationPhase, ComponentProps<typeof Badge>["variant"]> = {
  queued: "secondary",
  generating: "warning",
  downloading: "warning",
  completed: "success",
  failed: "destructive",
  canceled: "secondary",
};
