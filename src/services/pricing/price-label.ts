import { type VideoModel } from "@/services/providers/types";

import { videoTokensPerSecond } from "./video-format";

/** Reference aspect ratio for headline prices — matches OpenRouter's site. */
const LABEL_ASPECT_RATIO = "16:9";

/**
 * "$0.15" | "$0.04" | "$0.0231" — dollar amounts for rate labels. Sub-cent
 * rates keep up to four decimals (trailing zeros trimmed) so cheap models
 * don't all collapse to "$0.00".
 */
export function formatUsd(value: number): string {
  if (value >= 0.1) return `$${value.toFixed(2)}`;
  let text = value.toFixed(4);
  while (text.endsWith("0") && !text.endsWith(".00")) text = text.slice(0, -1);
  return `$${text}`;
}

/**
 * The one catalog price signal for a model, shared by the model select, the
 * inspector and the settings model list — as data, not prose, so every
 * screen renders it through the i18n layer. `from: true` means the price
 * varies by resolution, audio or mode and this is the minimum; the cost
 * estimate resolves the exact figure. Token-priced models (Seedance) are
 * converted to USD/s at 16:9 across their supported resolutions. `null`
 * means the UI should say "Price unavailable".
 */
export type ModelPriceLabel =
  { kind: "per-second"; usd: number; from: boolean } | { kind: "per-request"; usd: number };

function rangeLabel(prices: number[]): ModelPriceLabel {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { kind: "per-second", usd: min, from: min !== max };
}

export function modelPriceLabel(model: VideoModel): ModelPriceLabel | null {
  const { perSecond, perToken, perRequestUsd } = model.pricing;

  if (perSecond.length > 0) {
    return rangeLabel(perSecond.map((p) => p.usdPerSecond));
  }

  if (perToken.length > 0) {
    const rates: number[] = [];
    for (const resolution of model.capabilities.resolutions ?? []) {
      const tokensPerSecond = videoTokensPerSecond(resolution, LABEL_ASPECT_RATIO);
      if (tokensPerSecond === null) continue;
      for (const price of perToken) rates.push(price.usdPerToken * tokensPerSecond);
    }
    return rates.length > 0 ? rangeLabel(rates) : null;
  }

  if (perRequestUsd !== null) return { kind: "per-request", usd: perRequestUsd };
  return null;
}
