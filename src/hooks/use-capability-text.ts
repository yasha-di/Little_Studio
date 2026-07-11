import * as React from "react";

import { useT, type MessageKey, type Translate } from "@/i18n";
import {
  type CapabilityId,
  type CapabilityReason,
  type GenerationMode,
} from "@/services/capabilities";
import { formatUsd, type ModelPriceLabel } from "@/services/pricing";
import { type JobFailure, type UnknownCostReason } from "@/types";

/**
 * The bridge between typed service vocabulary (capability ids, reasons,
 * failure codes, generation modes) and translated UI copy. Services stay
 * language-free; every screen renders them through these helpers.
 */

const modeKeyBase: Record<GenerationMode, string> = {
  "text-to-video": "mode.textToVideo",
  "image-to-video": "mode.imageToVideo",
  "start-end": "mode.startEnd",
  extend: "mode.extend",
  loop: "mode.loop",
};

export function capabilityLabelKey(id: CapabilityId): MessageKey {
  return `capability.${id}.label` as MessageKey;
}

export function capabilityDescriptionKey(id: CapabilityId): MessageKey {
  return `capability.${id}.description` as MessageKey;
}

export function modeLabelKey(mode: GenerationMode): MessageKey {
  return `${modeKeyBase[mode]}.label` as MessageKey;
}

export function modeDescriptionKey(mode: GenerationMode): MessageKey {
  return `${modeKeyBase[mode]}.description` as MessageKey;
}

export function capabilityReasonText(t: Translate, reason: CapabilityReason): string {
  switch (reason.kind) {
    case "choose-model":
      return t("capabilityReason.chooseModel");
    case "not-supported":
      return t("capabilityReason.notSupported", {
        model: reason.model,
        feature: t(capabilityLabelKey(reason.capability)),
      });
    case "not-reported":
      return t("capabilityReason.notReported", {
        model: reason.model,
        feature: t(capabilityLabelKey(reason.capability)),
      });
    case "coming-soon":
      return t("capabilityReason.comingSoon");
  }
}

/** Typed pricing vocabulary → translated copy: catalog price labels
 * ("from $0.04/s") and why an estimate is unknown. */
export function priceLabelText(t: Translate, label: ModelPriceLabel | null): string | null {
  if (label === null) return null;
  if (label.kind === "per-request") return t("price.perRequest", { amount: formatUsd(label.usd) });
  return label.from
    ? t("price.perSecondFrom", { amount: formatUsd(label.usd) })
    : t("price.perSecond", { amount: formatUsd(label.usd) });
}

export function estimateReasonText(t: Translate, reason: UnknownCostReason): string {
  switch (reason.kind) {
    case "no-model":
      return t("estimate.noModel");
    case "no-duration":
      return t("estimate.noDuration");
    case "needs-resolution":
      return t("estimate.needsResolution");
    case "needs-aspect-ratio":
      return t("estimate.needsAspectRatio");
    case "needs-audio":
      return t("estimate.needsAudio");
    case "no-price-for-format":
      return reason.format === null
        ? t("estimate.noPriceForFormat")
        : t("estimate.noPriceForNamedFormat", { format: reason.format });
    case "no-pricing":
      return t("estimate.noPricing");
  }
}

/** Failure codes with a translated message; anything else (e.g. provider
 * validation text) renders raw — it is the provider's own explanation. */
const TRANSLATED_FAILURES = new Set([
  "AUTHENTICATION",
  "RATE_LIMITED",
  "TIMEOUT",
  "NETWORK",
  "INSUFFICIENT_CREDITS",
  "GENERATION_FAILED",
]);

export function useFailureText(): (failure: JobFailure) => string {
  const t = useT();
  return React.useCallback(
    (failure: JobFailure) =>
      TRANSLATED_FAILURES.has(failure.code)
        ? t(`failure.${failure.code}` as MessageKey)
        : failure.message,
    [t],
  );
}
