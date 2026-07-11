import {
  FastForward,
  GalleryHorizontalEnd,
  Image,
  Repeat2,
  Type,
  type LucideIcon,
} from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { capabilityReasonText, modeDescriptionKey, modeLabelKey } from "@/hooks";
import { useT } from "@/i18n";
import {
  GENERATION_MODES,
  modeAvailability,
  type CapabilityProfile,
  type GenerationMode,
} from "@/services/capabilities";
import { cn } from "@/lib/utils";

const modeIcon: Record<GenerationMode, LucideIcon> = {
  "text-to-video": Type,
  "image-to-video": Image,
  "start-end": GalleryHorizontalEnd,
  extend: FastForward,
  loop: Repeat2,
};

interface ModeSelectorProps {
  value: GenerationMode;
  profile: CapabilityProfile;
  onChange: (mode: GenerationMode) => void;
}

/**
 * The generation mode picker — the first creative decision, made before
 * any model setting. Every mode is always visible so the product's range
 * is discoverable, but only modes the selected model (and this build) can
 * actually deliver are selectable; the rest explain themselves on hover.
 */
function ModeSelector({ value, profile, onChange }: ModeSelectorProps) {
  const t = useT();
  return (
    <div role="radiogroup" aria-label={t("mode.selectorAria")} className="flex flex-wrap gap-1.5">
      {GENERATION_MODES.map((mode) => {
        const availability = modeAvailability(profile, mode);
        const active = mode === value;
        const Icon = modeIcon[mode];

        const chip = (
          <button
            type="button"
            role="radio"
            aria-checked={active}
            disabled={!availability.enabled && !active}
            onClick={() => {
              if (availability.enabled) onChange(mode);
            }}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs transition-[color,background-color,border-color,box-shadow] duration-150 outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring/50",
              active
                ? "border-primary/60 bg-primary/10 text-foreground shadow-glow-primary"
                : availability.enabled
                  ? "border-border bg-surface-1 text-muted-foreground hover:border-border-strong hover:bg-surface-3 hover:text-foreground"
                  : "cursor-not-allowed border-border/60 bg-surface-1 text-muted-foreground/45",
            )}
          >
            <Icon className={cn("size-3.5 shrink-0", active && "text-primary")} />
            {t(modeLabelKey(mode))}
          </button>
        );

        return (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              {/* span wrapper: disabled buttons don't emit hover events */}
              <span>{chip}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-56">
              {availability.enabled || availability.reason === null
                ? t(modeDescriptionKey(mode))
                : capabilityReasonText(t, availability.reason)}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export { ModeSelector };
