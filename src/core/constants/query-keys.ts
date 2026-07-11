/**
 * Centralized TanStack Query key factory.
 *
 * Keys are hierarchical so invalidation can target any level:
 *   invalidateQueries({ queryKey: queryKeys.projects.all })
 * kills every project-related query at once.
 *
 * No feature may hand-write a query key — it must come from here. This is
 * what keeps cache invalidation reliable as the app grows.
 */
export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    detail: (projectId: string) => [...queryKeys.projects.all, "detail", projectId] as const,
  },
  scenes: {
    all: ["scenes"] as const,
    byProject: (projectId: string) => [...queryKeys.scenes.all, "by-project", projectId] as const,
    /** All scenes across projects — powers per-project scene counts. */
    counts: () => [...queryKeys.scenes.all, "counts"] as const,
  },
  generations: {
    all: ["generations"] as const,
    byScene: (sceneId: string) => [...queryKeys.generations.all, "by-scene", sceneId] as const,
    versions: (generationId: string) =>
      [...queryKeys.generations.all, generationId, "versions"] as const,
    job: (jobId: string) => [...queryKeys.generations.all, "job", jobId] as const,
  },
  results: {
    all: ["results"] as const,
    list: () => [...queryKeys.results.all, "list"] as const,
    byVersion: (versionId: string) => [...queryKeys.results.all, "by-version", versionId] as const,
  },
  referenceImages: {
    all: ["reference-images"] as const,
    detail: (imageId: string) => [...queryKeys.referenceImages.all, imageId] as const,
  },
  activity: {
    all: ["activity"] as const,
    feed: () => [...queryKeys.activity.all, "feed"] as const,
  },
  providers: {
    all: ["providers"] as const,
    status: (providerId: string) => [...queryKeys.providers.all, providerId, "status"] as const,
    models: (providerId: string) => [...queryKeys.providers.all, providerId, "models"] as const,
    balance: (providerId: string) => [...queryKeys.providers.all, providerId, "balance"] as const,
  },
} as const;
