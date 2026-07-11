import { QueryClient } from "@tanstack/react-query";

/**
 * Single QueryClient instance for the whole app.
 *
 * Defaults are tuned for a desktop client talking to paid generation APIs:
 * - `refetchOnWindowFocus: false` — window focus toggles constantly on
 *   desktop; implicit refetches against metered endpoints are unacceptable.
 * - modest `staleTime` so navigation between pages doesn't refetch
 *   identical data.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
