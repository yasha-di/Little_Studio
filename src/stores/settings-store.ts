import { create } from "zustand";

import { type ProviderId } from "@/services/providers";

/**
 * User-configurable application settings.
 *
 * Sprint 0: shape only, no consumers mutate it yet. Persisted via
 * `services/persistence` under `storageKeys.settings` in a later sprint.
 *
 * NOTE: provider API keys will NOT live here — secrets go through the OS
 * keychain (Tauri stronghold/keyring plugin) when authentication lands.
 */
interface SettingsState {
  defaultProviderId: ProviderId;
  setDefaultProviderId: (providerId: ProviderId) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  defaultProviderId: "openrouter",
  setDefaultProviderId: (providerId) => {
    set({ defaultProviderId: providerId });
  },
}));
