import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import * as React from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { storageKeys } from "@/core/constants";
import { I18nProvider } from "@/i18n";

import { queryClient } from "./query-client";

/**
 * React Query Devtools never ship: the `import.meta.env.DEV` guard is
 * statically false in production builds, so the whole branch (including
 * the dynamic import) is eliminated from the bundle. Even in development
 * the panel stays hidden unless explicitly opted into via
 * `localStorage.setItem("little-studio:devtools", "1")`.
 */
const QueryDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })),
    )
  : null;

function devtoolsEnabled(): boolean {
  try {
    return window.localStorage.getItem(storageKeys.devtools) === "1";
  } catch {
    return false;
  }
}

/**
 * Composition root for all cross-cutting React context.
 * New providers (theme, i18n, auth) slot in here — nowhere else.
 * MotionConfig honours the OS "reduce motion" preference app-wide.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <MotionConfig reducedMotion="user">
          <TooltipProvider>{children}</TooltipProvider>
        </MotionConfig>
      </I18nProvider>
      {QueryDevtools !== null && devtoolsEnabled() && (
        <React.Suspense fallback={null}>
          <QueryDevtools initialIsOpen={false} />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
}
