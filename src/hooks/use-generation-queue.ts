import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/constants";
import {
  selectSceneTask,
  selectVersionTask,
  useQueueStore,
  type GenerationTask,
} from "@/services/generation";
import { generationJobRepository, generationResultRepository } from "@/services/repositories";
import { type GenerationJobId, type GenerationVersionId, type SceneId } from "@/types";

/**
 * React bindings for the generation pipeline.
 *
 * Live queue state (phases, failures) comes straight from the queue store;
 * persisted artifacts (results, finished jobs) flow through TanStack Query
 * and are invalidated by the queue subscriber in the composition root.
 */

/** The task a scene should display: the active one, else the newest. */
export function useSceneTask(sceneId: SceneId | null): GenerationTask | null {
  return useQueueStore((state) => (sceneId === null ? null : selectSceneTask(state, sceneId)));
}

/** Live task for one specific version, when this session is running it. */
export function useVersionTask(versionId: GenerationVersionId | null): GenerationTask | null {
  return useQueueStore((state) =>
    versionId === null ? null : selectVersionTask(state, versionId),
  );
}

/** The stored artifact of a version (null while nothing finished). */
export function useGenerationResult(versionId: GenerationVersionId | null) {
  return useQuery({
    queryKey: queryKeys.results.byVersion(versionId ?? "none"),
    queryFn: () => (versionId === null ? null : generationResultRepository.getByVersion(versionId)),
    enabled: versionId !== null,
  });
}

/** A persisted job record — status/cost survive app restarts. */
export function useGenerationJob(jobId: GenerationJobId | null) {
  return useQuery({
    queryKey: queryKeys.generations.job(jobId ?? "none"),
    queryFn: () => (jobId === null ? null : generationJobRepository.getById(jobId)),
    enabled: jobId !== null,
  });
}
