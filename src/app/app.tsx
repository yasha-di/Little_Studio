import { useEffect } from "react";
import { RouterProvider } from "react-router";

import { LaunchScreen } from "@/components/shared";
import { queryKeys } from "@/core/constants";
import { generationQueue } from "@/services/generation";
import { openRouterSession } from "@/services/openrouter/session";
import { getConnectionState } from "@/services/providers";

import { AppProviders } from "./providers/app-providers";
import { queryClient } from "./providers/query-client";
import { router } from "./router/routes";

/** How often the account status (balance, key validity) is re-checked. */
const CONNECTION_REFRESH_MS = 60_000;

export function App() {
  useEffect(() => {
    // Restore the provider connection from the stored key on launch…
    void openRouterSession.initialize().then(() => {
      // …then resume generations that were still running last session.
      void generationQueue.initialize();
    });
    // Keep balance / key validity fresh while the app is open.
    const timer = setInterval(() => {
      if (getConnectionState("openrouter").status === "connected") {
        void openRouterSession.refresh();
      }
    }, CONNECTION_REFRESH_MS);

    // The queue is not a React citizen; translate its events into cache
    // invalidations here, in the composition root.
    const unsubscribe = generationQueue.subscribe(({ task }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.generations.byScene(task.sceneId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.generations.versions(task.generationId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.generations.job(task.jobId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
      if (task.phase === "completed") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.results.all });
        // The generation was billed — refresh the remaining credits.
        void openRouterSession.refresh();
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
      <LaunchScreen />
    </AppProviders>
  );
}
