import { estimateReasonText, useSceneTask } from "@/hooks";
import { useOpenRouterConnection, useVideoModels } from "@/hooks/use-openrouter";
import { useT } from "@/i18n";
import { trimNumber } from "@/lib/duration";
import { type GenerationMode } from "@/services/capabilities";
import { TERMINAL_PHASES } from "@/services/generation";
import { formatUsd, perSecondRate, pricingStrategy } from "@/services/pricing";
import { getProvider } from "@/services/providers";
import { type Scene } from "@/types";

import { draftEstimationInput } from "../data/estimation";
import { phaseLabelKey } from "./phase-badge";

/**
 * The always-visible cost strip (VS Code status bar style): estimated vs
 * actual cost, remaining credits and the active format at a glance.
 * Unknown numbers stay unknown — the bar never invents a value.
 */
function StatusBar({ draft, mode }: { draft: Scene; mode: GenerationMode }) {
  const t = useT();
  const connection = useOpenRouterConnection();
  const models = useVideoModels();
  const task = useSceneTask(draft.id);

  const generation = draft.generation;
  const model = models.data?.find((m) => m.id === generation.modelId) ?? null;
  const estimationInput = model ? draftEstimationInput(draft, model, mode) : null;
  const estimate = estimationInput ? pricingStrategy.estimate(estimationInput) : null;
  const rate = estimationInput ? perSecondRate(estimationInput) : null;
  const balance = connection.status === "connected" ? connection.account.balance : null;

  const estimateLabel =
    estimate === null
      ? t("statusbar.estNone")
      : estimate.kind === "estimated"
        ? t("statusbar.estValue", { amount: estimate.money.amount.toFixed(3) })
        : t("statusbar.estUnknown");
  // The tooltip spells the arithmetic out ("$0.15/s × 8s") whenever the
  // published pricing resolves to one rate — the estimate must never feel
  // like a black box.
  const estimateTitle =
    estimate === null
      ? t("statusbar.estSelectModel")
      : estimate.kind === "unknown"
        ? estimateReasonText(t, estimate.reason)
        : rate !== null && generation.durationSeconds !== null
          ? t("statusbar.estBreakdown", {
              rate: t("price.perSecond", { amount: formatUsd(rate) }),
              seconds: trimNumber(generation.durationSeconds),
            })
          : t("statusbar.estPublished");

  const actual = task?.actualCost ?? null;
  const isBusy = task !== null && !TERMINAL_PHASES.has(task.phase);

  return (
    <footer
      data-slot="status-bar"
      className="app-chrome flex h-7 shrink-0 items-center justify-between gap-3 border-t bg-topbar px-3 font-mono text-2xs text-muted-foreground/70"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span title={estimateTitle}>{estimateLabel}</span>
        {actual !== null && (
          <>
            <span aria-hidden="true">·</span>
            <span title={t("statusbar.lastTakeTitle")}>
              {t("statusbar.lastTake", { amount: actual.money.amount.toFixed(4) })}
            </span>
          </>
        )}
        <span aria-hidden="true">·</span>
        <span
          title={balance === null ? t("statusbar.creditsConnect") : t("statusbar.creditsRemaining")}
        >
          {t("statusbar.credits", {
            amount: balance === null ? "—" : `$${balance.amount.toFixed(2)}`,
          })}
        </span>
        {isBusy && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-warning" title={t("statusbar.liveTitle")}>
              {t(phaseLabelKey[task.phase]).toLowerCase()}…
            </span>
          </>
        )}
      </div>
      {/* Right side: only what is actually set — no "—" noise. */}
      <div className="flex shrink-0 items-center gap-3">
        {generation.durationSeconds !== null && (
          <span title={t("statusbar.plannedDuration")}>
            {trimNumber(generation.durationSeconds)}s
          </span>
        )}
        {generation.resolution !== null && (
          <span title={t("statusbar.resolution")}>{generation.resolution}</span>
        )}
        {generation.aspectRatio !== null && (
          <span title={t("statusbar.aspectRatio")}>{generation.aspectRatio}</span>
        )}
        {model !== null && (
          <span title={t("statusbar.provider")}>{getProvider(model.providerId).info.name}</span>
        )}
      </div>
    </footer>
  );
}

export { StatusBar };
