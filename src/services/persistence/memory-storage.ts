import { type KeyValueStorage } from "./types";

/**
 * In-memory implementation of `KeyValueStorage`.
 *
 * Not a persistence backend — it exists so the abstraction is exercised by
 * a real implementation from day one (and as the storage double for unit
 * tests). Durable adapters (Tauri Store) arrive in a later sprint.
 */
export class MemoryStorage implements KeyValueStorage {
  private readonly data = new Map<string, unknown>();

  get<T>(key: string): Promise<T | null> {
    return Promise.resolve(this.data.has(key) ? (this.data.get(key) as T) : null);
  }

  set(key: string, value: unknown): Promise<void> {
    this.data.set(key, value);
    return Promise.resolve();
  }

  remove(key: string): Promise<void> {
    this.data.delete(key);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.data.clear();
    return Promise.resolve();
  }
}
