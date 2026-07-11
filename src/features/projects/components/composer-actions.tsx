import { AnimatePresence, motion } from "framer-motion";
import { Ban, Sparkles, TriangleAlert } from "lucide-react";
import { NavLink } from "react-router";

import {
  Button,
  Progress,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { useFailureText } from "@/hooks";
import { useT } from "@/i18n";
import { transitions } from "@/lib/motion";
import { formatShortcut } from "@/lib/shortcuts";
import { type JobFailure } from "@/types";

import { type GenerateControl } from "../data/use-generate";
import { GenerationSuccess } from "./generation-success";
import { phaseLabelKey } from "./phase-badge";

/** Failure codes whose recovery lives in Preferences, not in a retry. */
const PREFERENCES_FAILURES = new Set(["AUTHENTICATION", "INSUFFICIENT_CREDITS"]);

/** The quiet "what to do next" coach line for the idle composer. */
function NextStepHint({ control }: { control: GenerateControl }) {
  const t = useT();
  switch (control.blocker) {
    case "connect-provider":
      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-xs text-muted-foreground">
            {t("composer.hintConnect")}
          </span>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <NavLink to="/settings">{t("composer.openPreferences")}</NavLink>
          </Button>
        </div>
      );
    case "loading-models":
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3.5" />
          {t("composer.hintLoadingModels")}
        </div>
      );
    case "choose-model":
      return (
        <span className="truncate text-xs text-muted-foreground">
          {t("composer.hintChooseModel")}
        </span>
      );
    case "mode-unavailable":
      return (
        <span
          className="truncate text-xs text-muted-foreground"
          title={control.disabledReason ?? undefined}
        >
          {control.disabledReason}
        </span>
      );
    case "no-extend-source":
      return (
        <span className="truncate text-xs text-muted-foreground">
          {t("blocker.noExtendSource")}
        </span>
      );
    case "choose-extend-source":
      return (
        <span className="truncate text-xs text-muted-foreground">
          {t("composer.hintChooseExtendSource")}
        </span>
      );
    case "add-start-image":
      return (
        <span className="truncate text-xs text-muted-foreground">
          {t("composer.hintAddStartImage")}
        </span>
      );
    case "add-end-image":
      return (
        <span className="truncate text-xs text-muted-foreground">
          {t("composer.hintAddEndImage")}
        </span>
      );
    case "write-prompt":
      return (
        <span className="truncate text-xs text-muted-foreground/70">
          {t("composer.hintWritePrompt")}
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-success/80" />
          {t("composer.hintReady")}
        </span>
      );
  }
}

function FailureNotice({ failure }: { failure: JobFailure }) {
  const t = useT();
  const failureText = useFailureText();
  const message = failureText(failure);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/15">
        <TriangleAlert className="size-3 text-destructive" />
      </span>
      <span className="min-w-0 flex-1 text-xs leading-snug text-foreground/90" title={message}>
        {message}
      </span>
      {PREFERENCES_FAILURES.has(failure.code) && (
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <NavLink to="/settings">{t("composer.openPreferences")}</NavLink>
        </Button>
      )}
    </div>
  );
}

/**
 * The action band at the bottom of the prompt composer: write, then
 * generate — the whole creative loop lives inside one canvas. The band is
 * also the workflow's quiet guide: while idle it names the next step,
 * while running it shows live progress + cancel, on success it celebrates
 * the finished take with immediate actions, and on failure it explains
 * calmly what happened and how to recover.
 */
function ComposerActions({ control }: { control: GenerateControl }) {
  const t = useT();
  const task = control.task;
  const isBusy = control.isBusy;

  if (task !== null && task.phase === "completed") {
    return (
      <div className="flex min-h-12 items-center border-t border-success/15 bg-linear-to-r from-success/5 to-transparent px-3 py-2">
        <GenerationSuccess
          task={task}
          onGenerateAgain={control.generate}
          generateAgainDisabled={control.disabledReason !== null}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-t border-border/60 px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center">
        <AnimatePresence initial={false} mode="wait">
          {isBusy && task !== null ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitions.fast}
              className="flex w-full items-center gap-2.5"
            >
              {task.progress !== null ? (
                <Progress value={task.progress * 100} className="max-w-56 flex-1" />
              ) : (
                <Spinner className="size-3.5" />
              )}
              <span className="truncate text-xs text-muted-foreground">
                {t(phaseLabelKey[task.phase])}…
              </span>
            </motion.div>
          ) : task !== null && task.phase === "failed" && task.failure !== null ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={transitions.normal}
              className="flex w-full items-center"
            >
              <FailureNotice failure={task.failure} />
            </motion.div>
          ) : task !== null && task.phase === "canceled" ? (
            <motion.span
              key="canceled"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitions.fast}
              className="truncate text-xs text-muted-foreground/70"
            >
              {t("composer.canceled")}
            </motion.span>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitions.fast}
              className="flex w-full min-w-0 items-center"
            >
              <NextStepHint control={control} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isBusy ? (
        <Button variant="outline" size="sm" onClick={control.cancel}>
          <Ban className="size-3.5" />
          {t("composer.cancel")}
        </Button>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">
              <Button disabled={control.disabledReason !== null} onClick={control.generate}>
                <Sparkles className="size-4" />
                {task !== null && task.phase === "failed" && task.failure?.retryable === true
                  ? t("composer.tryAgain")
                  : t("composer.generate")}
                <span className="ml-0.5 font-mono text-2xs opacity-70">
                  {formatShortcut("generate")}
                </span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {control.disabledReason ??
              t("composer.generateTooltip", { shortcut: formatShortcut("generate") })}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export { ComposerActions };
