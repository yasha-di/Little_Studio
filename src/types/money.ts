/**
 * Money and cost primitives.
 *
 * Costs flow through three honest states: unknown → estimated → actual.
 * "Unknown" is a first-class value, not a null — pricing data is often
 * unavailable and the UI must be able to say so explicitly.
 */

export interface Money {
  /** Decimal amount in `currency` units (not cents). */
  amount: number;
  /** ISO-4217 code; provider credits use "USD" on OpenRouter. */
  currency: string;
}

/**
 * Why a cost cannot be estimated — typed, never prose, so the UI renders
 * it through the i18n layer in the active language (same contract as
 * `CapabilityReason`).
 */
export type UnknownCostReason =
  | { kind: "no-model" }
  | { kind: "no-duration" }
  | { kind: "needs-resolution" }
  | { kind: "needs-aspect-ratio" }
  | { kind: "needs-audio" }
  | { kind: "no-price-for-format"; format: string | null }
  | { kind: "no-pricing" };

export type CostEstimate =
  { kind: "unknown"; reason: UnknownCostReason } | { kind: "estimated"; money: Money };

export interface ActualCost {
  money: Money;
  /** Provider-native credits consumed, when reported separately. */
  creditsUsed: number | null;
}

export const unknownCost = (reason: UnknownCostReason): CostEstimate => ({
  kind: "unknown",
  reason,
});
