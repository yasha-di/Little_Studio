import { ArrowDown, ArrowUp, Copy, EllipsisVertical, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import { PanelHeader, SectionLabel } from "@/components/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Modal,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { useT } from "@/i18n";
import { formatShortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import { type Scene, type SceneId } from "@/types";

interface SceneRailProps {
  scenes: Scene[];
  activeSceneId: SceneId | null;
  onSelect: (sceneId: SceneId) => void;
  onCreate: () => void;
  onDuplicate: (scene: Scene) => void;
  onDelete: (sceneId: SceneId) => void;
  onMove: (sceneId: SceneId, direction: "up" | "down") => void;
}

function SceneRow({
  scene,
  index,
  count,
  active,
  onSelect,
  onDuplicate,
  onRequestDelete,
  onMove,
}: {
  scene: Scene;
  index: number;
  count: number;
  active: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onRequestDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const t = useT();
  return (
    <div
      className={cn(
        "group relative flex h-8 items-center rounded-md transition-colors duration-150",
        active ? "bg-sidebar-accent shadow-raised" : "hover:bg-sidebar-accent/60",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 -left-1.5 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity duration-150",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <button
        type="button"
        onClick={onSelect}
        className="flex h-full min-w-0 flex-1 items-center gap-2 px-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {/* Frame-number chip — the rail reads like a film strip's edge code. */}
        <span
          className={cn(
            "flex h-5 w-6 shrink-0 items-center justify-center rounded-sm font-mono text-3xs transition-colors duration-150",
            active
              ? "bg-primary/15 text-primary"
              : "bg-surface-2 text-muted-foreground/60 group-hover:text-muted-foreground",
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            active ? "text-foreground" : "text-sidebar-foreground",
          )}
        >
          {scene.name}
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("scenes.actionsFor", { name: scene.name })}
            className="mr-0.5 size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          >
            <EllipsisVertical className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right">
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy /> {t("scenes.duplicate")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index === 0}
            onSelect={() => {
              onMove("up");
            }}
          >
            <ArrowUp /> {t("scenes.moveUp")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index === count - 1}
            onSelect={() => {
              onMove("down");
            }}
          >
            <ArrowDown /> {t("scenes.moveDown")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onRequestDelete}>
            <Trash2 /> {t("scenes.deleteConfirm")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * The project's scene list — a compact, ordered rail. One click opens a
 * scene; every structural action (duplicate, reorder, delete) hides behind
 * a per-row menu so the resting state stays quiet.
 */
function SceneRail({
  scenes,
  activeSceneId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onMove,
}: SceneRailProps) {
  const t = useT();
  const [pendingDelete, setPendingDelete] = React.useState<Scene | null>(null);

  return (
    <div className="flex h-full flex-col bg-sidebar/40">
      <PanelHeader className="justify-between pr-1">
        <SectionLabel>
          {t("scenes.title")}
          <span className="ml-1.5 font-mono text-muted-foreground/50">{scenes.length}</span>
        </SectionLabel>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t("scenes.new")} onClick={onCreate}>
              <Plus className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t("scenes.new")} · {formatShortcut("new-scene")}
          </TooltipContent>
        </Tooltip>
      </PanelHeader>

      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-1.5">
        {scenes.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-relaxed text-muted-foreground/70">
            {t("scenes.empty", { shortcut: formatShortcut("new-scene") })}
          </p>
        ) : (
          scenes.map((scene, index) => (
            <SceneRow
              key={scene.id}
              scene={scene}
              index={index}
              count={scenes.length}
              active={scene.id === activeSceneId}
              onSelect={() => {
                onSelect(scene.id);
              }}
              onDuplicate={() => {
                onDuplicate(scene);
              }}
              onRequestDelete={() => {
                setPendingDelete(scene);
              }}
              onMove={(direction) => {
                onMove(scene.id, direction);
              }}
            />
          ))
        )}
      </div>

      <Modal
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={t("scenes.deleteTitle", { name: pendingDelete?.name ?? "" })}
        description={t("scenes.deleteDescription")}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setPendingDelete(null);
              }}
            >
              {t("composer.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete !== null) onDelete(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              {t("scenes.deleteConfirm")}
            </Button>
          </>
        }
      />
    </div>
  );
}

export { SceneRail };
