import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/constants";
import { sceneRepository } from "@/services/repositories";
import { newId, nowIso, type ProjectId, type Scene, type SceneId } from "@/types";

import { makeScene, normalizeScene, sceneNameForOrder } from "./factories";

/**
 * React bindings for scene data within one project.
 *
 * Scene lists are small (a project holds tens of scenes), so mutations
 * simply refresh the per-project query; the editor's keystroke-level state
 * lives in `useAutosaveScene`, not here.
 */

export function useScenes(projectId: ProjectId | null) {
  return useQuery({
    queryKey: queryKeys.scenes.byProject(projectId ?? "none"),
    queryFn: async () => {
      if (projectId === null) return [];
      const scenes = await sceneRepository.listByProject(projectId);
      return scenes.map(normalizeScene);
    },
    enabled: projectId !== null,
  });
}

function invalidateScenes(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: ProjectId,
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.scenes.byProject(projectId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.scenes.counts() });
}

/**
 * New scenes inherit the previous scene's model and format settings —
 * consecutive scenes almost always share a look, so the creator tunes once
 * and keeps going. Seed and duration intentionally reset.
 */
export function useCreateScene(projectId: ProjectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<Scene> => {
      const existing = await sceneRepository.listByProject(projectId);
      const last = existing.at(-1);
      const scene = makeScene(projectId, existing.length);
      if (last !== undefined) {
        const previous = normalizeScene(last);
        scene.generation = {
          ...scene.generation,
          modelId: previous.generation.modelId,
          resolution: previous.generation.resolution,
          aspectRatio: previous.generation.aspectRatio,
          generateAudio: previous.generation.generateAudio,
        };
      }
      await sceneRepository.save(scene);
      return scene;
    },
    onSuccess: () => {
      invalidateScenes(queryClient, projectId);
    },
  });
}

export function useDuplicateScene(projectId: ProjectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (source: Scene): Promise<Scene> => {
      const existing = await sceneRepository.listByProject(projectId);
      const timestamp = nowIso();
      const copy: Scene = {
        ...normalizeScene(source),
        id: newId<"SceneId">(),
        name: `${source.name} copy`,
        order: existing.length,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await sceneRepository.save(copy);
      return copy;
    },
    onSuccess: () => {
      invalidateScenes(queryClient, projectId);
    },
  });
}

/** Full-object upsert; the autosave hook and rename flows both use it. */
export function useUpdateScene(projectId: ProjectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scene: Scene): Promise<Scene> => {
      // `order` is owned by the reorder mutations, not the editor: a stale
      // draft flushing after a move must not undo the move.
      const stored = await sceneRepository.getById(scene.id);
      const updated: Scene = {
        ...scene,
        order: stored?.order ?? scene.order,
        updatedAt: nowIso(),
      };
      await sceneRepository.save(updated);
      return updated;
    },
    onSuccess: (updated) => {
      // Patch the cached list in place: a background autosave must never
      // trigger a refetch that could clobber text being typed right now.
      queryClient.setQueryData<Scene[]>(queryKeys.scenes.byProject(projectId), (scenes) =>
        scenes?.map((s) => (s.id === updated.id ? updated : s)),
      );
    },
  });
}

/** Removes a scene and re-numbers the remainder so orders stay contiguous. */
export function useDeleteScene(projectId: ProjectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sceneId: SceneId) => {
      await sceneRepository.remove(sceneId);
      const rest = await sceneRepository.listByProject(projectId);
      for (const [index, scene] of rest.entries()) {
        if (scene.order !== index) await sceneRepository.save({ ...scene, order: index });
      }
    },
    onSuccess: () => {
      invalidateScenes(queryClient, projectId);
    },
  });
}

/** Swaps a scene with its neighbour (keyboard-friendly reordering). */
export function useMoveScene(projectId: ProjectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sceneId, direction }: { sceneId: SceneId; direction: "up" | "down" }) => {
      const scenes = await sceneRepository.listByProject(projectId);
      const index = scenes.findIndex((s) => s.id === sceneId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const scene = scenes[index];
      const neighbour = scenes[targetIndex];
      if (scene === undefined || neighbour === undefined) return;
      await sceneRepository.save({ ...scene, order: neighbour.order });
      await sceneRepository.save({ ...neighbour, order: scene.order });
    },
    onSuccess: () => {
      invalidateScenes(queryClient, projectId);
    },
  });
}

export { sceneNameForOrder };
