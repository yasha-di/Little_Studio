import { createStorage } from "@/services/persistence";

/**
 * Secret storage — API keys and future credentials.
 *
 * Isolated from general persistence on purpose:
 * - its own namespace file ("secrets.json" via Tauri Store, app-data dir,
 *   never inside the repository);
 * - a deliberately narrow API so secrets can't leak through generic
 *   list/clear code paths;
 * - one place to upgrade to the OS keychain (tauri-plugin-keyring /
 *   stronghold) without touching any consumer.
 *
 * Secrets must never be logged — `core/logging` additionally redacts
 * key-shaped strings as a second line of defense.
 */
export interface SecretStorage {
  get(name: string): Promise<string | null>;
  set(name: string, value: string): Promise<void>;
  remove(name: string): Promise<void>;
}

export const secretNames = {
  openrouterApiKey: "openrouter.apiKey",
} as const;

const storage = createStorage("secrets");

export const secretStorage: SecretStorage = {
  get: (name) => storage.get<string>(name),
  set: (name, value) => storage.set(name, value),
  remove: (name) => storage.remove(name),
};

/** Displays a key safely: "sk-or-v1…a1b2". Never render the raw value. */
export function maskSecret(value: string): string {
  if (value.length <= 12) return "•".repeat(value.length);
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}
