import { ChevronRight, Clapperboard, Plus } from "lucide-react";
import * as React from "react";
import { NavLink, useNavigate, useParams } from "react-router";

import { EmptyState } from "@/components/shared";
import { Button, Loading, Panel, PanelGroup, PanelSeparator } from "@/components/ui";
import { useShortcut } from "@/hooks";
import { useVideoModels } from "@/hooks/use-openrouter";
import { useT } from "@/i18n";
import { useRegisterCommand } from "@/lib/commands";
import { formatShortcut } from "@/lib/shortcuts";
import {
  modeAvailability,
  resolveCapabilities,
  type GenerationMode,
} from "@/services/capabilities";
import { useUiStore } from "@/stores";
import {
  type GenerationVersionId,
  type Project,
  type ProjectId,
  type Scene,
  type SceneId,
} from "@/types";

import { Inspector } from "../components/inspector";
import { PROMPT_EDITOR_ID } from "../components/prompt-editor";
import { SceneEditor } from "../components/scene-editor";
import { SceneRail } from "../components/scene-rail";
import { StatusBar } from "../components/status-bar";
import { VersionsPanel } from "../components/versions-panel";
import { useGenerateControl } from "../data/use-generate";
import { useAutosaveScene, type ScenePatch } from "../data/use-scene-autosave";
import { useProject, useUpdateProject } from "../data/use-projects";
import {
  useCreateScene,
  useDeleteScene,
  useDuplicateScene,
  useMoveScene,
  useScenes,
} from "../data/use-scenes";
import { type InspectorTarget } from "../workspace-types";

function WorkspaceHeader({ project }: { project: Project }) {
  const t = useT();
  const updateProject = useUpdateProject();
  const [name, setName] = React.useState(project.name);

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed !== "" && trimmed !== project.name) {
      updateProject.mutate({ ...project, name: trimmed });
    } else {
      setName(project.name);
    }
  };

  return (
    <div className="app-chrome flex h-10 shrink-0 items-center gap-1.5 border-b px-3">
      <NavLink
        to="/projects"
        className="shrink-0 rounded-sm text-xs text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {t("nav.projects")}
      </NavLink>
      <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-muted-foreground/50" />
      <input
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setName(project.name);
            event.currentTarget.blur();
          }
        }}
        aria-label={t("workspace.projectName")}
        spellCheck={false}
        className="h-7 w-full max-w-xs min-w-0 rounded-md bg-transparent px-1.5 text-sm font-medium outline-none select-text hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring/50"
      />
    </div>
  );
}

interface SceneWorkspaceProps {
  scene: Scene;
  scenes: Scene[];
  onSelectScene: (sceneId: SceneId) => void;
  onCreateScene: () => void;
  onDuplicateScene: (scene: Scene) => void;
  onDeleteScene: (sceneId: SceneId) => void;
  onMoveScene: (sceneId: SceneId, direction: "up" | "down") => void;
}

/**
 * The three-panel creative workspace for one scene: scene rail | editor |
 * inspector, with the version tree across the bottom and the cost strip
 * under everything. Mounted with `key={scene.id}` — the autosave draft
 * lives and dies with the mount, and panel sizes survive through the
 * ui-store.
 */
function SceneWorkspace({
  scene,
  scenes,
  onSelectScene,
  onCreateScene,
  onDuplicateScene,
  onDeleteScene,
  onMoveScene,
}: SceneWorkspaceProps) {
  const { draft, patch, flush } = useAutosaveScene(scene);
  const [target, setTarget] = React.useState<InspectorTarget>({ kind: "draft" });
  const panelLayouts = useUiStore((state) => state.panelLayouts);
  const setPanelLayout = useUiStore((state) => state.setPanelLayout);

  // The generation mode is derived, never synced: the user's last explicit
  // choice, downgraded to Text to Video whenever the selected model cannot
  // deliver it. Because the request is kept (not overwritten), switching
  // back to a capable model restores the requested mode by itself — and a
  // scene with a start image opens in Image to Video from the first render.
  const [requestedMode, setRequestedMode] = React.useState<GenerationMode>(
    scene.startImageId !== null && scene.endImageId !== null
      ? "start-end"
      : scene.startImageId !== null
        ? "image-to-video"
        : "text-to-video",
  );
  const [extendSourceId, setExtendSourceId] = React.useState<GenerationVersionId | null>(null);

  const models = useVideoModels();
  const model = models.data?.find((m) => m.id === draft.generation.modelId) ?? null;
  const capabilities = resolveCapabilities(model);
  const mode: GenerationMode = modeAvailability(capabilities, requestedMode).enabled
    ? requestedMode
    : "text-to-video";

  const control = useGenerateControl(draft, flush, { mode, extendSourceId });

  const handleModeChange = React.useCallback(
    (next: GenerationMode) => {
      setRequestedMode(next);
      // A mode must not carry hidden guidance frames it cannot use.
      const clears: ScenePatch = {};
      if (next === "text-to-video" && draft.startImageId !== null) clears.startImageId = null;
      if (next !== "start-end" && draft.endImageId !== null) clears.endImageId = null;
      if (Object.keys(clears).length > 0) patch(clears);
    },
    [draft.startImageId, draft.endImageId, patch],
  );

  useShortcut("generate", control.generate);
  useRegisterCommand({
    id: "scene.generate",
    title: "Generate video",
    group: "Generation",
    shortcutId: "generate",
    enabled: () => control.disabledReason === null,
    run: control.generate,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelGroup
        orientation="vertical"
        defaultLayout={panelLayouts["workspace-rows"]}
        onLayoutChanged={(layout) => {
          setPanelLayout("workspace-rows", layout);
        }}
      >
        <Panel id="main" minSize="45%">
          <PanelGroup
            orientation="horizontal"
            defaultLayout={panelLayouts["workspace-cols"]}
            onLayoutChanged={(layout) => {
              setPanelLayout("workspace-cols", layout);
            }}
          >
            <Panel id="rail" defaultSize="230px" minSize="180px" maxSize="340px">
              <SceneRail
                scenes={scenes}
                activeSceneId={scene.id}
                onSelect={onSelectScene}
                onCreate={onCreateScene}
                onDuplicate={onDuplicateScene}
                onDelete={onDeleteScene}
                onMove={onMoveScene}
              />
            </Panel>
            <PanelSeparator />
            <Panel id="editor" minSize="30%">
              <div className="h-full overflow-y-auto">
                <SceneEditor
                  draft={draft}
                  patch={patch}
                  control={control}
                  mode={mode}
                  extendSourceId={extendSourceId}
                  onSelectExtendSource={setExtendSourceId}
                />
              </div>
            </Panel>
            <PanelSeparator />
            <Panel id="inspector" defaultSize="300px" minSize="260px" maxSize="420px">
              <Inspector
                draft={draft}
                patch={patch}
                target={target}
                onBackToDraft={() => {
                  setTarget({ kind: "draft" });
                }}
                control={control}
                mode={mode}
                onModeChange={handleModeChange}
              />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelSeparator />
        <Panel id="versions" defaultSize="230px" minSize="130px" maxSize="50%">
          <VersionsPanel
            sceneId={scene.id}
            target={target}
            onSelectVersion={(version) => {
              setTarget({ kind: "version", version });
            }}
          />
        </Panel>
      </PanelGroup>
      <StatusBar draft={draft} mode={mode} />
    </div>
  );
}

export function ProjectWorkspacePage() {
  const t = useT();
  const params = useParams<{ projectId: string; sceneId?: string }>();
  const projectId = params.projectId as ProjectId;
  const sceneIdParam = (params.sceneId ?? null) as SceneId | null;
  const navigate = useNavigate();

  const project = useProject(projectId);
  const scenes = useScenes(projectId);
  const createScene = useCreateScene(projectId);
  const duplicateScene = useDuplicateScene(projectId);
  const deleteScene = useDeleteScene(projectId);
  const moveScene = useMoveScene(projectId);

  const sceneList = scenes.data ?? [];
  const activeScene = sceneList.find((s) => s.id === sceneIdParam) ?? null;

  const openScene = React.useCallback(
    (sceneId: SceneId, options: { replace?: boolean } = {}) => {
      void navigate(
        `/projects/${projectId}/scenes/${sceneId}`,
        options.replace === true ? { replace: true } : undefined,
      );
    },
    [navigate, projectId],
  );

  // No scene in the URL (or a stale one): land on the first scene.
  React.useEffect(() => {
    if (scenes.data === undefined || activeScene !== null) return;
    const first = scenes.data[0];
    if (first !== undefined) openScene(first.id, { replace: true });
  }, [scenes.data, activeScene, openScene]);

  const handleCreateScene = React.useCallback(() => {
    createScene.mutate(undefined, {
      onSuccess: (scene) => {
        openScene(scene.id);
      },
    });
  }, [createScene, openScene]);

  useShortcut("new-scene", handleCreateScene);
  useShortcut("focus-prompt", () => {
    document.getElementById(PROMPT_EDITOR_ID)?.focus();
  });
  useRegisterCommand({
    id: "scene.new",
    title: "New scene",
    group: "Scenes",
    shortcutId: "new-scene",
    run: handleCreateScene,
  });

  if (project.isPending || scenes.isPending) return <Loading />;

  if (project.data === null || project.isError) {
    return (
      <EmptyState
        icon={Clapperboard}
        title={t("workspace.notFound")}
        description={t("workspace.notFoundDescription")}
        action={
          <Button asChild variant="secondary">
            <NavLink to="/projects">{t("workspace.backToProjects")}</NavLink>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceHeader key={project.data.id} project={project.data} />
      {activeScene !== null ? (
        <SceneWorkspace
          key={activeScene.id}
          scene={activeScene}
          scenes={sceneList}
          onSelectScene={openScene}
          onCreateScene={handleCreateScene}
          onDuplicateScene={(scene) => {
            duplicateScene.mutate(scene, {
              onSuccess: (copy) => {
                openScene(copy.id);
              },
            });
          }}
          onDeleteScene={(sceneId) => {
            deleteScene.mutate(sceneId, {
              onSuccess: () => {
                if (sceneId === activeScene.id) {
                  void navigate(`/projects/${projectId}`, { replace: true });
                }
              },
            });
          }}
          onMoveScene={(sceneId, direction) => {
            moveScene.mutate({ sceneId, direction });
          }}
        />
      ) : (
        <EmptyState
          icon={Clapperboard}
          title={t("workspace.noScenes")}
          description={t("workspace.noScenesDescription")}
          action={
            <Button onClick={handleCreateScene}>
              <Plus />
              {t("scenes.new")}
            </Button>
          }
          hint={{ keys: formatShortcut("new-scene"), label: t("workspace.createsScene") }}
        />
      )}
    </div>
  );
}
