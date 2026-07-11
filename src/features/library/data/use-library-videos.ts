import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/constants";
import {
  generationRepository,
  generationResultRepository,
  generationVersionRepository,
  projectRepository,
  sceneRepository,
} from "@/services/repositories";
import { type GenerationResult, type GenerationVersion } from "@/types";

/** One gallery entry: the artifact plus the names that give it meaning. */
export interface LibraryVideo {
  result: GenerationResult;
  version: GenerationVersion | null;
  sceneName: string | null;
  projectName: string | null;
}

/**
 * Every generated video across all projects, newest first. Joined in memory
 * — collections are user-sized (see the repository trade-off note), and the
 * query invalidates on `results.all` whenever the queue completes a job.
 */
export function useLibraryVideos() {
  return useQuery({
    queryKey: queryKeys.results.list(),
    queryFn: async (): Promise<LibraryVideo[]> => {
      const [results, versions, generations, scenes, projects] = await Promise.all([
        generationResultRepository.list(),
        generationVersionRepository.list(),
        generationRepository.list(),
        sceneRepository.list(),
        projectRepository.list(),
      ]);

      const versionById = new Map(versions.map((v) => [v.id, v]));
      const generationById = new Map(generations.map((g) => [g.id, g]));
      const sceneById = new Map(scenes.map((s) => [s.id, s]));
      const projectById = new Map(projects.map((p) => [p.id, p]));

      return results
        .map((result) => {
          const version = versionById.get(result.versionId) ?? null;
          const generation =
            version === null ? null : (generationById.get(version.generationId) ?? null);
          const scene = generation === null ? null : (sceneById.get(generation.sceneId) ?? null);
          const project = scene === null ? null : (projectById.get(scene.projectId) ?? null);
          return {
            result,
            version,
            sceneName: scene?.name ?? null,
            projectName: project?.name ?? null,
          };
        })
        .sort((a, b) => b.result.createdAt.localeCompare(a.result.createdAt));
    },
  });
}
