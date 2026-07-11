/**
 * Application-wide static configuration.
 *
 * Single source of truth for identity and environment flags.
 * Anything user-configurable belongs in the settings store instead.
 */
export const appConfig = {
  name: "Little Studio",
  /** The product subtitle — shown on the launch screen and About dialog. */
  tagline: "Creative AI Video Workspace",
  version: __APP_VERSION__,
  isDev: import.meta.env.DEV,
  /** True when running inside the Tauri shell (vs. plain browser dev). */
  isTauri: "__TAURI_INTERNALS__" in window,
} as const;

export type AppConfig = typeof appConfig;
