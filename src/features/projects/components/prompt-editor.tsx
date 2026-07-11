import { ChevronRight } from "lucide-react";
import * as React from "react";

import { Kbd } from "@/components/ui/kbd";
import { capabilityReasonText, useDisclosure } from "@/hooks";
import { useI18n } from "@/i18n";
import { formatShortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { type GenerateControl } from "../data/use-generate";
import { ComposerActions } from "./composer-actions";

/** The Focus Prompt shortcut targets this id — no ref plumbing needed. */
export const PROMPT_EDITOR_ID = "scene-prompt-editor";

interface PromptEditorProps {
  text: string;
  negativeText: string | null;
  onTextChange: (text: string) => void;
  onNegativeTextChange: (text: string | null) => void;
  /** Generation control rendered as the composer's action band. */
  control: GenerateControl;
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/**
 * The prompt composer — the creative heart of the workspace.
 *
 * One canvas, not a form field: an elevated card that holds the prompt, the
 * collapsed negative prompt and the writing metadata. The card wakes up on
 * focus (accent hairline + soft glow) so the eye lands here first; the
 * chrome inside stays silent until needed.
 */
function PromptEditor({
  text,
  negativeText,
  onTextChange,
  onNegativeTextChange,
  control,
}: PromptEditorProps) {
  const { t, tCount } = useI18n();
  const words = wordCount(text);
  const negative = useDisclosure(negativeText !== null && negativeText !== "");

  // Honesty gate: when the selected model cannot take a negative prompt,
  // the control disappears (empty) or explains itself (text already
  // written) — it never poses as a working input.
  const negativeCapability = control.capabilities["negative-prompt"];
  const negativeUnsupported =
    !negativeCapability.enabled &&
    (negativeCapability.reason?.kind === "not-supported" ||
      negativeCapability.reason?.kind === "not-reported");
  const hasNegativeText = negativeText !== null && negativeText !== "";
  const showNegativeToggle = !negativeUnsupported || hasNegativeText;
  // A scene that has no prompt yet greets the writer with a live cursor:
  // the composer wakes (focus glow) and typing can start immediately.
  const [focusOnMount] = React.useState(text === "");

  return (
    <section
      aria-label={t("composer.composerAria")}
      className={cn(
        "group/composer relative flex flex-col overflow-hidden rounded-xl border bg-surface-1 shadow-raised",
        "transition-[border-color,box-shadow,background-color] duration-200",
        "hover:border-border-strong",
        "focus-within:border-primary/30 focus-within:bg-surface-2 focus-within:shadow-glow-primary",
      )}
    >
      {/* Accent hairline along the top edge — the "power on" light of the canvas. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-50 transition-opacity duration-200 group-focus-within/composer:opacity-100"
      />

      <textarea
        id={PROMPT_EDITOR_ID}
        value={text}
        onChange={(event) => {
          onTextChange(event.target.value);
        }}
        autoFocus={focusOnMount}
        placeholder={t("composer.promptPlaceholder")}
        spellCheck={false}
        aria-label={t("composer.prompt")}
        className="field-sizing-content min-h-48 w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-7 outline-none placeholder:text-muted-foreground/40"
      />

      <div className="flex items-center justify-between gap-2 px-3 pt-1 pb-2.5">
        {showNegativeToggle ? (
          <button
            type="button"
            onClick={negative.toggle}
            aria-expanded={negative.isOpen}
            className="flex h-6 w-fit items-center gap-1 rounded-sm px-1.5 text-2xs font-medium tracking-wider text-muted-foreground/70 uppercase transition-colors outline-none select-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ChevronRight
              className={cn(
                "size-3 transition-transform duration-150",
                negative.isOpen && "rotate-90",
              )}
            />
            {t("composer.negative")}
            {!negative.isOpen && hasNegativeText && (
              <span className="ml-1 max-w-64 truncate font-normal normal-case">{negativeText}</span>
            )}
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
        <span className="flex items-center gap-1.5 pr-1 font-mono text-2xs text-muted-foreground/50 select-none">
          {words === 0 ? (
            <>
              <Kbd>{formatShortcut("focus-prompt")}</Kbd>
              {t("composer.toWrite")}
            </>
          ) : (
            tCount("composer.words", words)
          )}
        </span>
      </div>

      {negative.isOpen && showNegativeToggle && (
        <div className="border-t border-border/60">
          <textarea
            value={negativeText ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              onNegativeTextChange(value === "" ? null : value);
            }}
            placeholder={t("composer.negativePlaceholder")}
            spellCheck={false}
            aria-label={t("composer.negative")}
            className="field-sizing-content min-h-16 w-full resize-none bg-transparent px-5 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground/40"
          />
          {negativeUnsupported && negativeCapability.reason !== null && (
            <p className="px-5 pb-2.5 text-2xs leading-snug text-warning">
              {capabilityReasonText(t, negativeCapability.reason)} {t("composer.negativeNotSent")}
            </p>
          )}
        </div>
      )}

      <ComposerActions control={control} />
    </section>
  );
}

export { PromptEditor };
