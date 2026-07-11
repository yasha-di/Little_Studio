import { motion } from "framer-motion";
import { Check, FolderOpen, Library, Play, Sparkles } from "lucide-react";
import * as React from "react";
import { NavLink } from "react-router";

import { Button, Modal, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { useGenerationResult } from "@/hooks";
import { useT } from "@/i18n";
import { easings } from "@/lib/motion";
import { type GenerationTask } from "@/services/generation";
import { canRevealInFolder, revealInFolder, videoPreviewSrc } from "@/services/media";

interface GenerationSuccessProps {
  task: GenerationTask;
  /** Starts the next take with the current draft. */
  onGenerateAgain: () => void;
  generateAgainDisabled: boolean;
}

/**
 * The moment of celebration when a take finishes: a springing check, the
 * new version's number, and every sensible next step one click away —
 * preview it, find it in the Library, open its file, or go again.
 * Deliberately quiet: a soft success wash inside the composer band, no
 * confetti, no modals.
 */
function GenerationSuccess({
  task,
  onGenerateAgain,
  generateAgainDisabled,
}: GenerationSuccessProps) {
  const t = useT();
  const result = useGenerationResult(task.versionId);
  const resultData = result.data ?? null;
  const src = resultData === null ? null : videoPreviewSrc(resultData);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [revealError, setRevealError] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex w-full min-w-0 items-center gap-2.5"
    >
      {/* Soft glow behind the check — success should feel warm, not loud. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-2 -left-3 w-32 bg-success/10 blur-xl"
      />
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 24 }}
        className="relative flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15"
      >
        <Check className="size-3 text-success" strokeWidth={3} />
      </motion.span>
      <span className="relative min-w-0 truncate text-xs">
        <span className="font-mono font-medium text-success">
          {t("take.number", { number: task.versionNumber })}
        </span>
        <span className="text-foreground"> {t("success.isReady")}</span>
        {task.actualCost != null && (
          <span className="ml-2 font-mono text-muted-foreground">
            ${task.actualCost.money.amount.toFixed(4)}
          </span>
        )}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {src !== null && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreviewOpen(true);
            }}
          >
            <Play className="size-3.5" />
            {t("common.preview")}
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" asChild>
              <NavLink to="/library" aria-label={t("success.showInLibrary")}>
                <Library className="size-3.5" />
              </NavLink>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t("success.showInLibrary")}</TooltipContent>
        </Tooltip>
        {resultData !== null && canRevealInFolder(resultData) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("success.openFolder")}
                onClick={() => {
                  setRevealError(false);
                  void revealInFolder(resultData).catch(() => {
                    setRevealError(true);
                  });
                }}
              >
                <FolderOpen className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {revealError ? t("success.openFolderError") : t("success.openFolder")}
            </TooltipContent>
          </Tooltip>
        )}
        <Button
          variant="secondary"
          size="sm"
          disabled={generateAgainDisabled}
          onClick={onGenerateAgain}
        >
          <Sparkles className="size-3.5" />
          {t("success.generateAgain")}
        </Button>
      </div>

      <Modal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={t("take.number", { number: task.versionNumber })}
        size="xl"
      >
        {src !== null && (
          <motion.video
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: easings.out }}
            src={src}
            controls
            autoPlay
            className="w-full rounded-lg bg-black"
          />
        )}
      </Modal>
    </motion.div>
  );
}

export { GenerationSuccess };
