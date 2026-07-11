import { StorageError } from "@/core/errors";

import { type KeyValueStorage } from "./types";

/**
 * Browser-dev implementation over `window.localStorage`.
 *
 * Exists so `npm run dev` (plain Vite, no Tauri shell) exercises the same
 * persistence code paths as production. Values are JSON-encoded; keys are
 * prefixed per namespace so `clear()` cannot touch foreign data.
 */
export class LocalStorageStorage implements KeyValueStorage {
  constructor(private readonly namespace: string) {}

  private prefixed(key: string): string {
    return `little-studio:${this.namespace}:${key}`;
  }

  get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(this.prefixed(key));
      return Promise.resolve(raw === null ? null : (JSON.parse(raw) as T));
    } catch (error) {
      return Promise.reject(
        new StorageError(`Failed to read "${key}" from "${this.namespace}".`, { cause: error }),
      );
    }
  }

  set(key: string, value: unknown): Promise<void> {
    try {
      localStorage.setItem(this.prefixed(key), JSON.stringify(value));
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(
        new StorageError(`Failed to write "${key}" to "${this.namespace}".`, { cause: error }),
      );
    }
  }

  remove(key: string): Promise<void> {
    localStorage.removeItem(this.prefixed(key));
    return Promise.resolve();
  }

  clear(): Promise<void> {
    const prefix = this.prefixed("");
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) doomed.push(key);
    }
    for (const key of doomed) localStorage.removeItem(key);
    return Promise.resolve();
  }
}
