import * as React from "react";

import { Input } from "@/components/ui";
import { useT } from "@/i18n";
import { formatSecondsHint, parseDurationInput, trimNumber } from "@/lib/duration";
import { cn } from "@/lib/utils";

interface DurationInputProps {
  /** Seconds, or null when unset. */
  value: number | null;
  onChange: (seconds: number | null) => void;
  /** Durations the selected model reports as supported (null = unconstrained). */
  supportedSeconds: number[] | null;
}

/**
 * Free-form duration entry: accepts plain seconds ("8", "2.5") and clock
 * time ("1:30"). If the model only supports specific durations the field
 * warns — it never rewrites what the user typed. Supported values render as
 * one-click chips because they are model data, not hardcoded presets.
 */
function DurationInput({ value, onChange, supportedSeconds }: DurationInputProps) {
  const t = useT();
  const [text, setText] = React.useState(value === null ? "" : trimNumber(value));
  const parsed = parseDurationInput(text);

  const commit = (raw: string) => {
    setText(raw);
    const result = parseDurationInput(raw);
    if (result.kind === "seconds") onChange(result.seconds);
    else if (result.kind === "empty") onChange(null);
    // invalid: keep the last persisted value, show the warning below
  };

  const unsupported =
    parsed.kind === "seconds" &&
    supportedSeconds !== null &&
    !supportedSeconds.includes(parsed.seconds);

  return (
    <div className="flex w-full flex-col items-end gap-1">
      <div className="relative w-full">
        <Input
          value={text}
          onChange={(event) => {
            commit(event.target.value);
          }}
          placeholder={t("duration.placeholder")}
          inputMode="decimal"
          aria-label={t("inspector.duration")}
          aria-invalid={parsed.kind === "invalid" || unsupported}
          className="h-8 pr-10 font-mono text-sm"
        />
        {parsed.kind === "seconds" && (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center font-mono text-2xs text-muted-foreground/60">
            {formatSecondsHint(parsed.seconds)}
          </span>
        )}
      </div>

      {parsed.kind === "invalid" && (
        <p className="text-2xs text-destructive">{t("duration.invalid")}</p>
      )}
      {unsupported && (
        <p className="text-right text-2xs text-warning">{t("duration.unsupported")}</p>
      )}
      {supportedSeconds !== null && supportedSeconds.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1">
          {supportedSeconds.map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => {
                commit(trimNumber(seconds));
              }}
              className={cn(
                "rounded-full border px-2 py-0.5 font-mono text-2xs transition-colors outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring/50",
                parsed.kind === "seconds" && parsed.seconds === seconds
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {trimNumber(seconds)}s
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { DurationInput };
