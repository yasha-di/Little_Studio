import { lazy } from "react";
import { createHashRouter, Navigate } from "react-router";

import { AppShell } from "@/layouts";

import { NotFoundPage } from "./not-found-page";
import { RouteErrorBoundary } from "./route-error-boundary";

/**
 * Pages are lazy-loaded through each feature's public API, so route-level
 * code-splitting never pierces feature boundaries.
 *
 * Hash-based history: Tauri serves the production bundle from a custom
 * protocol where deep BrowserRouter paths cannot be guaranteed to resolve
 * on reload. Hash routing is invisible in a desktop shell and 100% reliable.
 */
const ProjectsPage = lazy(() =>
  import("@/features/projects").then((m) => ({ default: m.ProjectsPage })),
);
const ProjectWorkspacePage = lazy(() =>
  import("@/features/projects").then((m) => ({ default: m.ProjectWorkspacePage })),
);
const LibraryPage = lazy(() =>
  import("@/features/library").then((m) => ({ default: m.LibraryPage })),
);
const SettingsPage = lazy(() =>
  import("@/features/settings").then((m) => ({ default: m.SettingsPage })),
);

export const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:projectId", element: <ProjectWorkspacePage /> },
      { path: "projects/:projectId/scenes/:sceneId", element: <ProjectWorkspacePage /> },
      { path: "library", element: <LibraryPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
