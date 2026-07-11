/**
 * Namespaced keys for local persistence.
 *
 * Every persisted value must register its key here — never inline string
 * keys at call sites. The `little-studio:` prefix prevents collisions and
 * makes app data easy to identify and migrate.
 */
export const storageKeys = {
  uiPreferences: "little-studio:ui-preferences",
  settings: "little-studio:settings",
  /** Dev-only opt-in flag ("1") that mounts React Query Devtools. */
  devtools: "little-studio:devtools",
  /** UI language ("en" | "ru"). */
  language: "little-studio:language",
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];
