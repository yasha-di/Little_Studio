import { load, type Store } from "@tauri-apps/plugin-store";

import { StorageError } from "@/core/errors";

import { type KeyValueStorage } from "./types";

/**
 * Durable storage backed by tauri-plugin-store: one JSON file per
 * namespace inside the OS app-data directory (never inside the project).
 * Writes are debounced to disk by the plugin (`autoSave`).
 */
export class TauriStoreStorage implements KeyValueStorage {
  private storePromise: Promise<Store> | null = null;

  constructor(private readonly namespace: string) {}

  private getStore(): Promise<Store> {
    // autoSave defaults to a 100ms debounced write-to-disk.
    this.storePromise ??= load(`${this.namespace}.json`).catch((error: unknown) => {
      this.storePromise = null; // allow retry on next call
      throw new StorageError(`Failed to open store "${this.namespace}".`, { cause: error });
    });
    return this.storePromise;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const store = await this.getStore();
      const value = await store.get<T>(key);
      return value ?? null;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to read "${key}" from "${this.namespace}".`, {
        cause: error,
      });
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    try {
      const store = await this.getStore();
      await store.set(key, value);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to write "${key}" to "${this.namespace}".`, {
        cause: error,
      });
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const store = await this.getStore();
      await store.delete(key);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to delete "${key}" from "${this.namespace}".`, {
        cause: error,
      });
    }
  }

  async clear(): Promise<void> {
    try {
      const store = await this.getStore();
      await store.clear();
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(`Failed to clear store "${this.namespace}".`, { cause: error });
    }
  }
}
