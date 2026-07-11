/**
 * Local persistence abstraction.
 *
 * Async, namespaced key-value storage. The interface is deliberately
 * minimal and async-first so any backend can satisfy it later without
 * touching call sites:
 *   - `localStorage` (browser dev)
 *   - Tauri Store plugin (JSON file on disk)
 *   - SQLite via tauri-plugin-sql (when data outgrows key-value)
 */
export interface KeyValueStorage {
  // Generic for callers: `get<Settings>(key)` beats casting from `unknown`
  // at every call site, mirroring @tauri-apps/plugin-store.
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

/** Factory signature: backends are chosen per namespace, not globally. */
export type StorageFactory = (namespace: string) => KeyValueStorage;
