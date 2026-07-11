import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/constants";
import { projectRepository } from "@/services/repositories";

/**
 * Active projects, newest first — shared read: the Projects page renders
 * the full grid from it and the sidebar shows the top of the same list.
 * Lives in the shared hooks layer (not the feature) so the app shell can
 * use it without importing the lazy-loaded feature pages.
 */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: async () => {
      const projects = await projectRepository.list();
      return projects
        .filter((p) => p.archivedAt === null)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
  });
}
