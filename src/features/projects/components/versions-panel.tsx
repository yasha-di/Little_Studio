import { History } from "lucide-react";

import { PanelHeader, SectionLabel } from "@/components/shared";
import { Skeleton } from "@/components/ui";
import { useT } from "@/i18n";
import { type GenerationVersion, type SceneId } from "@/types";

import { useSceneGenerations } from "../data/use-generations";
import { type InspectorTarget } from "../workspace-types";
import { TakePreview } from "./take-preview";
import { VersionTree } from "./version-tree";

interface VersionsPanelProps {
  sceneId: SceneId;
  target: InspectorTarget;
  onSelectVersion: (version: GenerationVersion) => void;
}

/**
 * The bottom panel: the scene's creative history. Every generated take is
 * kept and selectable — the tree on the left, the preview monitor for the
 * selected take on the right. Before the first generation the panel simply
 * says what it will become.
 */
function VersionsPanel({ sceneId, target, onSelectVersion }: VersionsPanelProps) {
  const t = useT();
  const generations = useSceneGenerations(sceneId);

  if (generations.isPending) {
    return (
      <div className="flex h-full flex-col gap-2 p-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-7 w-72" />
      </div>
    );
  }

  const first = generations.data?.[0];
  const versions = first === undefined ? [] : first.versions;

  if (versions.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-sidebar/30">
        <PanelHeader>
          <SectionLabel>{t("takes.title")}</SectionLabel>
        </PanelHeader>
        <div className="flex flex-1 items-center justify-center gap-2.5 p-4">
          <History aria-hidden="true" className="size-4 shrink-0 text-muted-foreground/50" />
          <p className="text-xs leading-relaxed text-muted-foreground/70">{t("takes.empty")}</p>
        </div>
      </div>
    );
  }

  const selectedId = target.kind === "version" ? target.version.id : null;
  const selectedVersion = target.kind === "version" ? target.version : null;

  return (
    <div className="flex h-full min-h-0 bg-sidebar/30">
      <div className="flex min-w-0 flex-1 flex-col">
        <PanelHeader>
          <SectionLabel>{t("takes.title")}</SectionLabel>
          <span className="truncate text-xs text-muted-foreground/60">
            {first?.generation.title}
          </span>
          <span className="ml-auto hidden text-2xs text-muted-foreground/50 select-none sm:block">
            {t("takes.selectHint")}
          </span>
        </PanelHeader>
        <div className="flex-1 overflow-auto p-3">
          <VersionTree versions={versions} selectedId={selectedId} onSelect={onSelectVersion} />
        </div>
      </div>
      <div aria-hidden="true" className="w-px shrink-0 bg-border" />
      <div className="w-64 shrink-0 xl:w-72">
        <TakePreview version={selectedVersion} />
      </div>
    </div>
  );
}

export { VersionsPanel };
