import { Check, Copy, Download, Film, FolderOpen, Play, type LucideIcon } from "lucide-react";
import * as React from "react";

import { Button, Modal, Spinner, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { useFailureText, useGenerationResult, useVersionTask } from "@/hooks";
import { useT } from "@/i18n";
import { formatSecondsHint } from "@/lib/duration";
import { copyText } from "@/lib/utils";
import { TERMINAL_PHASES } from "@/services/generation";
import {
  canRevealInFolder,
  revealInFolder,
  saveVideoCopy,
  videoPreviewSrc,
} from "@/services/media";
import { type GenerationResult, type GenerationVersion } from "@/types";

import { phaseLabelKey } from "./phase-badge";

function DisabledAction({
  icon: Icon,
  label,
  hint,
  compact = false,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  compact?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span wrapper: disabled elements don't emit hover events */}
        <span>
          {compact ? (
            <Button variant="ghost" size="icon-sm" disabled aria-label={label}>
              <Icon className="size-3.5" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <Icon className="size-3.5" />
              {label}
            </Button>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{hint}</TooltipContent>
    </Tooltip>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
          <Icon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

/** The monitor area: real video, live pipeline state, or honest emptiness. */
function Monitor({
  src,
  result,
  phase,
  failureMessage,
}: {
  src: string | null;
  result: GenerationResult | null;
  phase: string | null;
  failureMessage: string | null;
}) {
  const t = useT();
  if (src !== null) {
    return (
      <div className="flex min-h-10 w-full flex-1 items-stretch overflow-hidden rounded-lg border bg-black p-1 shadow-raised">
        <video src={src} controls preload="metadata" className="w-full rounded-md object-contain" />
      </div>
    );
  }
  return (
    <div className="flex min-h-10 w-full flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-black/30 p-2">
      {phase !== null ? (
        <>
          <Spinner className="size-4" />
          <span className="text-2xs text-muted-foreground/70">{phase}…</span>
        </>
      ) : failureMessage !== null ? (
        <>
          <Film className="size-5 text-destructive/60" />
          <span className="max-w-52 text-center text-2xs leading-relaxed text-destructive/90">
            {failureMessage}
          </span>
        </>
      ) : result !== null ? (
        <>
          <Film className="size-5 text-muted-foreground/40" />
          <span className="max-w-48 text-center text-2xs text-muted-foreground/50">
            {t("preview.cantPreview")}
          </span>
        </>
      ) : (
        <>
          <Film className="size-5 text-muted-foreground/40" />
          <span className="text-2xs text-muted-foreground/50">{t("preview.noVideo")}</span>
        </>
      )}
    </div>
  );
}

interface TakePreviewProps {
  version: GenerationVersion | null;
}

/**
 * The preview monitor for the selected take: plays the real generated
 * video, shows the live pipeline phase while one is in flight, and carries
 * the per-take actions (Preview / Download / Open location / Copy prompt).
 */
function TakePreview({ version }: TakePreviewProps) {
  const t = useT();
  const failureText = useFailureText();
  const versionId = version?.id ?? null;
  const task = useVersionTask(versionId);
  const result = useGenerationResult(versionId);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  if (version === null) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="max-w-44 text-center text-xs leading-relaxed text-muted-foreground/60">
          {t("preview.selectHint")}
        </p>
      </div>
    );
  }

  const { settings } = version;
  const resultData = result.data ?? null;
  const src = resultData === null ? null : videoPreviewSrc(resultData);
  const activePhase = task !== null && !TERMINAL_PHASES.has(task.phase) ? task.phase : null;
  const failureMessage =
    task?.phase === "failed" && task.failure !== null ? failureText(task.failure) : null;

  const runAction = (action: () => Promise<unknown>) => {
    setActionError(null);
    void action().catch((error: unknown) => {
      setActionError(error instanceof Error ? error.message : String(error));
    });
  };

  const handleCopyPrompt = () => {
    void copyText(version.prompt.text).then((ok) => {
      if (!ok) return;
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  };

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="font-mono text-xs font-medium">
          {t("take.number", { number: version.number })}
        </span>
        {version.label !== null && (
          <span className="truncate text-xs text-muted-foreground">{version.label}</span>
        )}
      </div>

      {/* The monitor flexes; the action rows below must never be pushed out. */}
      <Monitor
        src={src}
        result={resultData}
        phase={activePhase === null ? null : t(phaseLabelKey[activePhase])}
        failureMessage={failureMessage}
      />

      <div className="flex shrink-0 flex-wrap items-center gap-1 font-mono text-3xs text-muted-foreground/70">
        {settings.durationSeconds !== null && (
          <span className="rounded-sm border bg-surface-2 px-1.5 py-0.5">
            {formatSecondsHint(settings.durationSeconds)}
          </span>
        )}
        {settings.resolution !== null && (
          <span className="rounded-sm border bg-surface-2 px-1.5 py-0.5">
            {settings.resolution}
          </span>
        )}
        {settings.aspectRatio !== null && (
          <span className="rounded-sm border bg-surface-2 px-1.5 py-0.5">
            {settings.aspectRatio}
          </span>
        )}
        <span className="ml-auto rounded-sm border bg-surface-2 px-1.5 py-0.5">
          {settings.seed === null
            ? t("preview.seedRandom")
            : t("preview.seed", { seed: settings.seed })}
        </span>
      </div>

      {actionError !== null && (
        <p className="shrink-0 text-2xs leading-snug text-destructive">{actionError}</p>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {src !== null ? (
          <ActionButton
            icon={Play}
            label={t("common.preview")}
            onClick={() => {
              setPreviewOpen(true);
            }}
          />
        ) : (
          <DisabledAction
            compact
            icon={Play}
            label={t("common.preview")}
            hint={t("preview.hintNoVideo", { action: t("common.preview") })}
          />
        )}
        {resultData !== null ? (
          <ActionButton
            icon={Download}
            label={t("common.download")}
            onClick={() => {
              runAction(() => saveVideoCopy(resultData, `take-v${version.number}`));
            }}
          />
        ) : (
          <DisabledAction
            compact
            icon={Download}
            label={t("common.download")}
            hint={t("preview.hintNoVideo", { action: t("common.download") })}
          />
        )}
        {resultData !== null && canRevealInFolder(resultData) ? (
          <ActionButton
            icon={FolderOpen}
            label={t("common.openLocation")}
            onClick={() => {
              runAction(() => revealInFolder(resultData));
            }}
          />
        ) : (
          <DisabledAction
            compact
            icon={FolderOpen}
            label={t("common.openLocation")}
            hint={t("preview.hintOnDisk")}
          />
        )}
        <ActionButton
          icon={copied ? Check : Copy}
          label={t("common.copyPrompt")}
          onClick={handleCopyPrompt}
        />
      </div>

      <Modal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={t("take.number", { number: version.number })}
        size="xl"
      >
        {src !== null && (
          <video src={src} controls autoPlay className="w-full rounded-lg bg-black" />
        )}
      </Modal>
    </div>
  );
}

export { TakePreview };
