import {
  type PerSecondPrice,
  type PerTokenPrice,
  type VideoModel,
} from "@/services/providers/types";
import { type CostEstimate, unknownCost } from "@/types/money";

import { videoTokensPerSecond } from "./video-format";

/**
 * Pricing abstraction.
 *
 * Estimation is a *strategy* separate from providers because pricing
 * sources will multiply (published catalog prices today; measured
 * historical costs, promo credits, per-account discounts later) while the
 * question stays the same: "what will this job cost?".
 *
 * "Unknown" is an honest first-class answer — the UI shows it as such and
 * never invents a number. Both the cost estimate and the per-second rate
 * resolve through the same SKU-matching rules, so the two can never
 * disagree about what the selected configuration costs.
 */

export interface EstimationInput {
  model: VideoModel;
  durationSeconds: number | null;
  /** Selected output resolution; prices often differ per resolution. */
  resolution?: string | null;
  /** Selected aspect ratio; token-priced models bill by output pixels. */
  aspectRatio?: string | null;
  /** Whether audio generation is on; some models price it separately. */
  generateAudio?: boolean | null;
  /** text→video vs image→video, when the caller knows it. */
  mode?: "text-to-video" | "image-to-video" | null;
}

/** A configuration without duration — enough to resolve a per-second rate. */
export type RateInput = Omit<EstimationInput, "durationSeconds">;

export interface PricingStrategy {
  estimate(input: EstimationInput): CostEstimate;
}

const normalize = (value: string): string => value.trim().toLowerCase();

/**
 * The most specific per-second SKUs that apply to the input. A SKU applies
 * when every dimension it constrains matches the input; a dimension the
 * input leaves unset never disqualifies an SKU — it stays applicable and
 * surfaces as ambiguity ("needs-resolution"), not as a missing price.
 * Specificity counts only dimensions the input actually pins down, so an
 * SKU constraining an unset dimension (a 1080p surcharge before any
 * resolution is chosen) cannot silently shadow a flat price and later
 * surprise the user. Empty = no published price applies.
 */
function matchingPerSecondSkus(
  perSecond: readonly PerSecondPrice[],
  { resolution, generateAudio, mode }: RateInput,
): PerSecondPrice[] {
  const applicable = perSecond.filter((price) => {
    if (
      price.resolution !== null &&
      resolution !== null &&
      resolution !== undefined &&
      normalize(resolution) !== price.resolution
    ) {
      return false;
    }
    if (
      price.audio !== null &&
      generateAudio !== null &&
      generateAudio !== undefined &&
      price.audio !== generateAudio
    ) {
      return false;
    }
    if (price.mode !== null && mode !== null && mode !== undefined && price.mode !== mode) {
      return false;
    }
    return true;
  });

  if (applicable.length === 0) return [];

  const pinnedSpecificity = (price: PerSecondPrice): number => {
    let score = 0;
    if (price.resolution !== null && resolution !== null && resolution !== undefined) score += 1;
    if (price.audio !== null && generateAudio !== null && generateAudio !== undefined) score += 1;
    if (price.mode !== null && mode !== null && mode !== undefined) score += 1;
    return score;
  };
  const best = Math.max(...applicable.map(pinnedSpecificity));
  return applicable.filter((price) => pinnedSpecificity(price) === best);
}

/**
 * Distinct per-token rates that apply to the input — same applicability +
 * specificity rules as per-second SKUs, on the one dimension token prices
 * constrain: audio.
 */
function matchingPerTokenRates(
  perToken: readonly PerTokenPrice[],
  generateAudio: boolean | null | undefined,
): number[] {
  const applicable = perToken.filter(
    (price) =>
      price.audio === null ||
      generateAudio === null ||
      generateAudio === undefined ||
      price.audio === generateAudio,
  );
  if (applicable.length === 0) return [];

  const constrained = applicable.filter((p) => p.audio !== null);
  const pool = constrained.length > 0 ? constrained : applicable;
  return [...new Set(pool.map((p) => p.usdPerToken))];
}

/** Which SKU dimension still varies among tied candidates — names the
 * setting the user must pin down before the price resolves. */
function ambiguousDimension(skus: PerSecondPrice[]): "resolution" | "audio" {
  const resolutions = new Set(skus.map((p) => p.resolution));
  return resolutions.size > 1 ? "resolution" : "audio";
}

/**
 * The single USD-per-second rate the published pricing resolves to for
 * this configuration, or null when the pricing does not pin one down
 * (ambiguous SKUs, missing format, per-request models). Never approximated.
 */
export function perSecondRate(input: RateInput): number | null {
  const { perSecond, perToken } = input.model.pricing;

  if (perSecond.length > 0) {
    const rates = new Set(matchingPerSecondSkus(perSecond, input).map((p) => p.usdPerSecond));
    if (rates.size !== 1) return null;
    const [rate] = rates;
    return rate ?? null;
  }

  if (perToken.length > 0) {
    const { resolution, aspectRatio } = input;
    if (resolution === null || resolution === undefined) return null;
    if (aspectRatio === null || aspectRatio === undefined) return null;
    const tokensPerSecond = videoTokensPerSecond(resolution, aspectRatio);
    if (tokensPerSecond === null) return null;
    const rates = matchingPerTokenRates(perToken, input.generateAudio);
    if (rates.length !== 1) return null;
    return (rates[0] ?? 0) * tokensPerSecond;
  }

  return null;
}

/**
 * Estimates from the provider's published pricing SKUs. A SKU applies when
 * every dimension it constrains matches the input; among applicable SKUs
 * the most specific ones win. Ambiguity (several distinct prices remain)
 * is reported as unknown, never averaged away.
 */
export class CatalogPricingStrategy implements PricingStrategy {
  estimate(input: EstimationInput): CostEstimate {
    const { model, durationSeconds } = input;
    const { perSecond, perToken, perRequestUsd } = model.pricing;

    if (perSecond.length > 0) {
      if (durationSeconds === null) {
        return unknownCost({ kind: "no-duration" });
      }

      const skus = matchingPerSecondSkus(perSecond, input);
      if (skus.length === 0) {
        return unknownCost({ kind: "no-price-for-format", format: input.resolution ?? null });
      }

      const candidates = new Set(skus.map((p) => p.usdPerSecond));
      if (candidates.size > 1) {
        return unknownCost(
          ambiguousDimension(skus) === "resolution"
            ? { kind: "needs-resolution" }
            : { kind: "needs-audio" },
        );
      }

      const [usdPerSecond] = candidates;
      return {
        kind: "estimated",
        money: { amount: (usdPerSecond ?? 0) * durationSeconds, currency: "USD" },
      };
    }

    if (perToken.length > 0) {
      return estimateFromTokens(perToken, input);
    }

    if (perRequestUsd !== null) {
      return { kind: "estimated", money: { amount: perRequestUsd, currency: "USD" } };
    }

    return unknownCost({ kind: "no-pricing" });
  }
}

/**
 * Token-priced models (Seedance): tokens = pixels × 24 fps × seconds / 1024,
 * per OpenRouter's published formula. The estimate therefore needs duration,
 * resolution and aspect ratio — anything missing is an honest unknown.
 */
function estimateFromTokens(
  perToken: readonly PerTokenPrice[],
  input: EstimationInput,
): CostEstimate {
  const { durationSeconds, resolution, aspectRatio, generateAudio } = input;

  if (durationSeconds === null) {
    return unknownCost({ kind: "no-duration" });
  }
  if (resolution === null || resolution === undefined) {
    return unknownCost({ kind: "needs-resolution" });
  }
  if (aspectRatio === null || aspectRatio === undefined) {
    return unknownCost({ kind: "needs-aspect-ratio" });
  }

  const tokensPerSecond = videoTokensPerSecond(resolution, aspectRatio);
  if (tokensPerSecond === null) {
    return unknownCost({
      kind: "no-price-for-format",
      format: `${resolution} · ${aspectRatio}`,
    });
  }

  const rates = matchingPerTokenRates(perToken, generateAudio);
  if (rates.length === 0) {
    return unknownCost({ kind: "no-price-for-format", format: null });
  }
  if (rates.length > 1) {
    return unknownCost({ kind: "needs-audio" });
  }

  return {
    kind: "estimated",
    money: {
      amount: (rates[0] ?? 0) * tokensPerSecond * durationSeconds,
      currency: "USD",
    },
  };
}

export const pricingStrategy: PricingStrategy = new CatalogPricingStrategy();

export { formatUsd, modelPriceLabel, type ModelPriceLabel } from "./price-label";
