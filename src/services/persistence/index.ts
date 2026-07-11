import { appConfig } from "@/core/config";
import { createLogger } from "@/core/logging";

import { LocalStorageStorage } from "./local-storage-storage";
import { MemoryStorage } from "./memory-storage";
import { TauriStoreStorage } from "./tauri-store-storage";
import { type KeyValueStorage, type StorageFactory } from "./types";

export type { KeyValueStorage, StorageFactory };
export { LocalStorageStorage, MemoryStorage, TauriStoreStorage };

const log = createLogger("persistence");
const instances = new Map<string, KeyValueStorage>();
let warnedAboutBrowserStorage = false;

/**
 * Resolves the storage backend for a namespace (one instance per namespace):
 * - Tauri shell → tauri-plugin-store JSON file in the OS app-data dir.
 * - Plain browser dev → localStorage (with a one-time warning).
 *
 * Consumers only ever call `createStorage(namespace)` — swapping backends
 * (e.g. SQLite later) stays a one-file change.
 */
export const createStorage: StorageFactory = (namespace: string): KeyValueStorage => {
  const existing = instances.get(namespace);
  if (existing) return existing;

  let storage: KeyValueStorage;
  if (appConfig.isTauri) {
    storage = new TauriStoreStorage(namespace);
  } else {
    if (!warnedAboutBrowserStorage) {
      warnedAboutBrowserStorage = true;
      log.warn(
        "Running outside the Tauri shell: persisting to localStorage. " +
          "Data is browser-local and secrets are NOT protected by the OS.",
      );
    }
    storage = new LocalStorageStorage(namespace);
  }

  instances.set(namespace, storage);
  return storage;
};
