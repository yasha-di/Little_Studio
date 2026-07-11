import { Clapperboard } from "lucide-react";
import * as React from "react";

import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface ProjectCardProps extends React.ComponentProps<typeof Card> {
  name: string;
  description?: string;
  sceneCount: number;
  updatedAt: string;
  /** Stable seed for the poster gradient (defaults to `name`). */
  posterSeed?: string;
}

/** Deterministic hue from a seed — every film gets its own poster color. */
function posterHue(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

/** Dark, muted dual-hue wash under a soft top light — a poster, not candy. */
function posterBackground(seed: string): string {
  const hue = posterHue(seed);
  const hueB = (hue + 50) % 360;
  return [
    "linear-gradient(oklch(1 0 0 / 7%), oklch(1 0 0 / 0%) 45%)",
    `linear-gradient(140deg, oklch(0.34 0.07 ${String(hue)}), oklch(0.18 0.045 ${String(hueB)}))`,
  ].join(", ");
}

/**
 * A film-poster card: every project opens with its own color wash (derived
 * from a stable seed) until real thumbnails exist. Domain-agnostic —
 * features pass display props.
 */
function ProjectCard({
  name,
  description,
  sceneCount,
  updatedAt,
  posterSeed,
  className,
  ...props
}: ProjectCardProps) {
  const { locale, t, tCount } = useI18n();
  return (
    <Card
      data-slot="project-card"
      className={cn(
        "app-chrome gap-0 overflow-hidden py-0 transition-[border-color,box-shadow,transform] duration-150",
        "hover:-translate-y-px hover:border-border-strong hover:shadow-overlay",
        className,
      )}
      {...props}
    >
      <div
        className="relative flex aspect-[2/1] items-center justify-center"
        style={{ backgroundImage: posterBackground(posterSeed ?? name) }}
      >
        <Clapperboard className="size-7 text-white/25" />
        <span className="absolute right-2 bottom-2 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-3xs text-white/80">
          {tCount("projectCard.scenes", sceneCount)}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="truncate text-sm leading-none font-medium">{name}</h3>
        <p className="truncate text-sm text-muted-foreground">
          {description === undefined || description === ""
            ? t("projectCard.noDescription")
            : description}
        </p>
        <p className="pt-1 text-xs text-muted-foreground/70">
          {t("projectCard.updated", {
            date: new Date(updatedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US"),
          })}
        </p>
      </div>
    </Card>
  );
}

export { ProjectCard, type ProjectCardProps };
