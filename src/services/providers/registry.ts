import { AppError } from "@/core/errors";

import { type ProviderId, type VideoGenerationProvider } from "./types";

/**
 * Runtime registry of available providers.
 *
 * Providers self-register at module load (see `services/providers/index.ts`),
 * and consumers resolve them by id. This is the seam that keeps the rest of
 * the app provider-agnostic: swapping or adding providers touches only the
 * registration list.
 */
const providers = new Map<ProviderId, VideoGenerationProvider>();

export function registerProvider(provider: VideoGenerationProvider): void {
  if (providers.has(provider.info.id)) {
    throw new AppError(
      "PROVIDER_ALREADY_REGISTERED",
      `Provider "${provider.info.id}" is already registered.`,
    );
  }
  providers.set(provider.info.id, provider);
}

export function getProvider(id: ProviderId): VideoGenerationProvider {
  const provider = providers.get(id);
  if (!provider) {
    throw new AppError("PROVIDER_NOT_FOUND", `Provider "${id}" is not registered.`);
  }
  return provider;
}

export function listProviders(): VideoGenerationProvider[] {
  return [...providers.values()];
}
