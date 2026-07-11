import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/constants";
import { generationRepository, generationVersionRepository } from "@/services/repositories";
import { type Generation, type GenerationVersion, type SceneId } from "@/types";

export interface GenerationWithVersions {
  generation: Generation;
  versions: GenerationVersion[];
}

/**
 * A scene's generations together with their full version lists — the input
 * for the version tree. The generation queue writes these records; its
 * events invalidate this query, so the tree updates live while jobs run.
 */
export function useSceneGenerations(sceneId: SceneId | null) {
  return useQuery({
    queryKey: queryKeys.generations.byScene(sceneId ?? "none"),
    queryFn: async (): Promise<GenerationWithVersions[]> => {
      if (sceneId === null) return [];
      const generations = await generationRepository.listByScene(sceneId);
      return Promise.all(
        generations.map(async (generation) => ({
          generation,
          versions: await generationVersionRepository.listByGeneration(generation.id),
        })),
      );
    },
    enabled: sceneId !== null,
  });
}
