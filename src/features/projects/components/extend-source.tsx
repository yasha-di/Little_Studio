import { FastForward } from "lucide-react";

import { Skeleton } from "@/components/ui";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { type GenerationVersion, type GenerationVersionId, type SceneId } from "@/types";

import { useSceneGenerations } from "../data/use-generations";
import { EditorSection } from "./editor-section";

interface ExtendSourceProps {
  sceneId: SceneId;
  value: GenerationVersionId | null;
  onChange: (versionId: GenerationVersionId) => void;
}

function SourceChip({
  version,
  selected,
  onSelect,
}: {
  version: GenerationVersion;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex h-7 max-w-56 items-center gap-1.5 rounded-md border px-2 transition-[color,background-color,border-color,box-shadow] duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        selected
          ? "border-primary/60 bg-primary/15 text-foreground shadow-glow-primary"
          : "border-border bg-surface-1 hover:border-border-strong hover:bg-surface-3",
      )}
    >
      <span className="font-mono text-xs font-medium">
        {t("take.number", { number: version.number })}
      </span>
      {version.label !== null && (
        <span className="truncate text-xs text-muted-foreground">{version.label}</span>
      )}
    </button>
  );
}

/**
 * Extend mode's source picker: which of this scene's takes the new
 * generation should continue from. Extend can never silently fall back to
 * a normal generation — without a take there is nothing to extend, and the
 * section says so in plain words.
 */
function ExtendSource({ sceneId, value, onChange }: ExtendSourceProps) {
  const t = useT();
  const generations = useSceneGenerations(sceneId);

  if (generations.isPending) {
    return (
      <EditorSection title={t("extend.continueFrom")}>
        <Skeleton className="h-7 w-56" />
      </EditorSection>
    );
  }

  const versions = generations.data?.[0]?.versions ?? [];

  if (versions.length === 0) {
    return (
      <EditorSection title={t("extend.continueFrom")}>
        <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-input/80 bg-surface-1 px-3 py-2.5">
          <FastForward aria-hidden="true" className="size-4 shrink-0 text-muted-foreground/50" />
          <p className="text-xs leading-relaxed text-muted-foreground">{t("extend.empty")}</p>
        </div>
      </EditorSection>
    );
  }

  return (
    <EditorSection title={t("extend.continueFrom")}>
      <div role="radiogroup" aria-label={t("extend.sourceAria")} className="flex flex-wrap gap-1.5">
        {versions.map((version) => (
          <SourceChip
            key={version.id}
            version={version}
            selected={version.id === value}
            onSelect={() => {
              onChange(version.id);
            }}
          />
        ))}
      </div>
      <p className="text-2xs text-muted-foreground/60">{t("extend.helper")}</p>
    </EditorSection>
  );
}

export { ExtendSource };
