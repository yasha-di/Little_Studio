import { create } from "zustand";

import { type ConnectionState, type ProviderId } from "./types";

/**
 * Live connection state per provider.
 *
 * This is client state (a state machine driven by session events), not
 * server state — hence Zustand rather than TanStack Query. It lives inside
 * `services/providers` because the *session* writes it; React components
 * only ever read it through `useConnectionState`.
 */
interface ConnectionStoreState {
  connections: Partial<Record<ProviderId, ConnectionState>>;
  setConnection: (providerId: ProviderId, state: ConnectionState) => void;
}

const DISCONNECTED: ConnectionState = { status: "disconnected" };

export const useConnectionStore = create<ConnectionStoreState>()((set) => ({
  connections: {},
  setConnection: (providerId, state) => {
    set((current) => ({ connections: { ...current.connections, [providerId]: state } }));
  },
}));

/** React hook: the connection state of one provider. */
export function useConnectionState(providerId: ProviderId): ConnectionState {
  return useConnectionStore((store) => store.connections[providerId] ?? DISCONNECTED);
}

/** Non-React accessor for services. */
export function getConnectionState(providerId: ProviderId): ConnectionState {
  return useConnectionStore.getState().connections[providerId] ?? DISCONNECTED;
}

export function setConnectionState(providerId: ProviderId, state: ConnectionState): void {
  useConnectionStore.getState().setConnection(providerId, state);
}
