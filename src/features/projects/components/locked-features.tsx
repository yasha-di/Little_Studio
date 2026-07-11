import { Brush, Camera, Palette, UserRound, type LucideIcon } from "lucide-react";

import { Badge, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { capabilityDescriptionKey, capabilityLabelKey, capabilityReasonText } from "@/hooks";
import { useT } from "@/i18n";
import { type CapabilityId, type CapabilityProfile } from "@/services/capabilities";

const FEATURES: readonly { id: CapabilityId; icon: LucideIcon }[] = [
  { id: "camera-controls", icon: Camera },
  { id: "motion-brush", icon: Brush },
  { id: "character-reference", icon: UserRound },
  { id: "style-reference", icon: Palette },
];

/**
 * The upcoming creative controls, shown as first-class (locked) residents
 * of the Inspector rather than hidden until launch day. Each row unlocks
 * by itself the moment a connected model reports the capability — the UI
 * is already wired through the capability registry.
 */
function LockedFeatures({ profile }: { profile: CapabilityProfile }) {
  const t = useT();
  const locked = FEATURES.filter((feature) => !profile[feature.id].enabled);
  if (locked.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {locked.map(({ id, icon: Icon }) => {
        const reason = profile[id].reason;
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <div
                aria-disabled="true"
                className="flex h-8 cursor-default items-center gap-2.5 rounded-md px-1.5 select-none"
              >
                <span className="flex size-5 items-center justify-center rounded-sm border bg-surface-2">
                  <Icon className="size-3 text-muted-foreground/60" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground/70">
                  {t(capabilityLabelKey(id))}
                </span>
                <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-3xs opacity-60">
                  {t("common.soon")}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-56">
              {t(capabilityDescriptionKey(id))}.
              {reason === null ? "" : ` ${capabilityReasonText(t, reason)}`}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export { LockedFeatures };
