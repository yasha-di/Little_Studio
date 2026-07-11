import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/constants";
import { projectRepository, sceneRepository } from "@/services/repositories";
import { nowIso, type Project, type ProjectId, type Scene } from "@/types";

import { makeProject, makeScene } from "./factories";

/**
 * React bindings for project data. All reads flow through TanStack Query,
 * all writes are mutations that keep the cache coherent — components never
 * touch repositories directly.
 */

// The list read lives in the shared hooks layer (the sidebar renders the
// same list); re-exported here so feature code keeps one import site.
export { useProjects } from "@/hooks/use-projects-list";

export function useProject(projectId: ProjectId | null) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? "none"),
    queryFn: () => (projectId === null ? null : projectRepository.getById(projectId)),
    enabled: projectId !== null,
  });
}

/** projectId → scene count, for the projects overview. */
export function useSceneCounts() {
  return useQuery({
    queryKey: queryKeys.scenes.counts(),
    queryFn: async () => {
      const scenes = await sceneRepository.list();
      const counts = new Map<ProjectId, number>();
      for (const scene of scenes) {
        counts.set(scene.projectId, (counts.get(scene.projectId) ?? 0) + 1);
      }
      return counts;
    },
  });
}

/**
 * Creates a project *with its first scene* in one step — a new project
 * should land the creator inside an editable scene, not on another empty
 * screen.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<{ project: Project; scene: Scene }> => {
      const project = makeProject(name);
      const scene = makeScene(project.id, 0);
      await projectRepository.save(project);
      await sceneRepository.save(scene);
      return { project, scene };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.scenes.all });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: Project) => {
      const updated: Project = { ...project, updatedAt: nowIso() };
      await projectRepository.save(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.projects.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

/** Deletes a project and cascades to its scenes. */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: ProjectId) => {
      const scenes = await sceneRepository.listByProject(projectId);
      for (const scene of scenes) await sceneRepository.remove(scene.id);
      await projectRepository.remove(projectId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.scenes.all });
    },
  });
}
