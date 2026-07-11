/**
 * Duration parsing/formatting for the workspace.
 *
 * The duration field accepts what a creator would naturally type — plain
 * seconds ("8", "2.5") or clock time ("0:08", "1:30", "1:02:30") — and the
 * app NEVER silently rewrites the value. Parsing yields an explicit
 * discriminated result so the UI can show honest validation instead.
 */

export type ParsedDuration =
  { kind: "empty" } | { kind: "invalid" } | { kind: "seconds"; seconds: number };

const CLOCK_PATTERN = /^(?:(\d+):)?([0-5]?\d):([0-5]?\d(?:\.\d+)?)$/;
const NUMBER_PATTERN = /^\d+(?:\.\d+)?$/;

export function parseDurationInput(raw: string): ParsedDuration {
  const text = raw.trim();
  if (text === "") return { kind: "empty" };

  if (NUMBER_PATTERN.test(text)) {
    const seconds = Number.parseFloat(text);
    return seconds > 0 ? { kind: "seconds", seconds } : { kind: "invalid" };
  }

  const clock = CLOCK_PATTERN.exec(text);
  if (clock !== null) {
    const hours = clock[1] === undefined ? 0 : Number.parseInt(clock[1], 10);
    const minutes = Number.parseInt(clock[2] ?? "0", 10);
    const seconds = Number.parseFloat(clock[3] ?? "0");
    const total = hours * 3600 + minutes * 60 + seconds;
    return total > 0 ? { kind: "seconds", seconds: total } : { kind: "invalid" };
  }

  return { kind: "invalid" };
}

/** "90" → "1:30"; sub-minute stays plain ("8s"). For hints, not storage. */
export function formatSecondsHint(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${trimNumber(totalSeconds)}s`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const secondsLabel = String(Math.floor(seconds)).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${secondsLabel}`
    : `${minutes}:${secondsLabel}`;
}

/** Compact number: drop trailing ".0" but keep real decimals ("2.5"). */
export function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}
