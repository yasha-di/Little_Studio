import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/constants";
import { openRouterSession } from "@/services/openrouter/session";
import { getProvider, useConnectionState, type ConnectionState } from "@/services/providers";

/**
 * React bindings for the OpenRouter session and provider.
 *
 * Server state (model catalog) flows through TanStack Query; connection
 * state flows from the session's state machine. Components import these
 * hooks — never the session or provider directly.
 */

export function useOpenRouterConnection(): ConnectionState {
  return useConnectionState("openrouter");
}

/** Masked stored key ("sk-or-v1…a1b2") for display in settings. */
export function useMaskedApiKey(enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.providers.status("openrouter"), "masked-key"],
    queryFn: () => openRouterSession.getMaskedKey(),
    enabled,
    staleTime: Infinity,
  });
}

/** Video-capable models, loaded dynamically from the provider catalog. */
export function useVideoModels() {
  const connection = useOpenRouterConnection();
  return useQuery({
    queryKey: queryKeys.providers.models("openrouter"),
    queryFn: () => getProvider("openrouter").listModels(),
    enabled: connection.status === "connected",
    staleTime: 10 * 60_000,
  });
}

export function useConnectOpenRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (apiKey: string) => openRouterSession.connect(apiKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.providers.all });
    },
  });
}

export function useDisconnectOpenRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => openRouterSession.disconnect(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.providers.all });
    },
  });
}

export function useRefreshOpenRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => openRouterSession.refresh(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.providers.all });
    },
  });
}
