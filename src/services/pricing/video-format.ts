/**
 * Output-format math for token-priced video models.
 *
 * OpenRouter documents Seedance-style token billing as
 * `tokens = height × width × durationSeconds × 24 / 1024` — so a USD
 * estimate needs the actual output dimensions. Providers publish formats as
 * "480p" / "720p" / "4K" plus an aspect ratio; the pixel dimensions follow
 * from those two. Verified against the catalog: 480p 16:9 (854×480) at
 * $0.0000024/token reproduces OpenRouter's published $0.02306/s exactly.
 */

/** Frames per second assumed by OpenRouter's video-token formula. */
export const VIDEO_TOKEN_FPS = 24;

/** Named resolutions that do not follow the `\d+p` convention. */
const NAMED_SHORT_SIDES: Record<string, number> = {
  "4k": 2160,
  "2k": 1440,
  "8k": 4320,
};

/** "720p" → 720, "4K" → 2160; null when the format is unrecognized. */
function shortSidePixels(resolution: string): number | null {
  const normalized = resolution.trim().toLowerCase();
  const named = NAMED_SHORT_SIDES[normalized];
  if (named !== undefined) return named;
  const match = /^(\d{3,4})p$/.exec(normalized);
  if (match === null) return null;
  return Number.parseInt(match[1] ?? "", 10);
}

/** "16:9" → 16/9 (long over short, always ≥ 1); null when unparsable. */
function longOverShortRatio(aspectRatio: string): number | null {
  const match = /^(\d+(?:\.\d+)?)\s*[:x]\s*(\d+(?:\.\d+)?)$/.exec(aspectRatio.trim());
  if (match === null) return null;
  const a = Number.parseFloat(match[1] ?? "");
  const b = Number.parseFloat(match[2] ?? "");
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  return Math.max(a, b) / Math.min(a, b);
}

/**
 * Total output pixels for a resolution + aspect ratio, or null when either
 * cannot be parsed. The long side is rounded to the nearest even pixel,
 * matching the provider's own arithmetic (480p 16:9 → 854×480).
 */
export function pixelCount(resolution: string, aspectRatio: string): number | null {
  const short = shortSidePixels(resolution);
  const ratio = longOverShortRatio(aspectRatio);
  if (short === null || ratio === null) return null;
  const long = Math.round((short * ratio) / 2) * 2;
  return short * long;
}

/** Video tokens consumed per second of output at the given format. */
export function videoTokensPerSecond(resolution: string, aspectRatio: string): number | null {
  const pixels = pixelCount(resolution, aspectRatio);
  return pixels === null ? null : (pixels * VIDEO_TOKEN_FPS) / 1024;
}
