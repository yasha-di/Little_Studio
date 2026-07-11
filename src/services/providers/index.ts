/**
 * Public API of the provider service.
 *
 * Registration happens here, once, at module load. Consumers import
 * `getProvider` / `listProviders` and the contract types — never a concrete
 * provider class.
 */
import { openRouterSession } from "@/services/openrouter/session";

import { registerProvider } from "./registry";

registerProvider(openRouterSession.provider);

export {
  getConnectionState,
  setConnectionState,
  useConnectionState,
  useConnectionStore,
} from "./connection-store";
export { getProvider, listProviders } from "./registry";
export type {
  AccountStatus,
  ConnectionState,
  ConnectionStatus,
  ProviderGenerationJob,
  ProviderId,
  ProviderInfo,
  ProviderJobStatus,
  VideoGenerationProvider,
  VideoGenerationRequest,
  VideoModel,
  VideoModelCapabilities,
  VideoModelPricing,
} from "./types";
