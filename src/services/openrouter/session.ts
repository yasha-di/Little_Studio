import { AuthenticationError, NetworkError, RateLimitError, toAppError } from "@/core/errors";
import { createLogger } from "@/core/logging";
import { setConnectionState } from "@/services/providers/connection-store";
import { OpenRouterVideoProvider } from "@/services/providers/openrouter/openrouter-video-provider";
import { type AccountStatus, type ConnectionState } from "@/services/providers/types";
import { maskSecret, secretNames, secretStorage } from "@/services/secrets";

import { OpenRouterClient } from "./client";

/**
 * OpenRouter session — the application service that owns the API key
 * lifecycle and drives the connection state machine.
 *
 * Responsibilities (and nothing else):
 *  - resolve the stored key for the client (the key never sits in memory
 *    longer than a request needs it, and never enters React state);
 *  - connect: validate a candidate key against the live API *before*
 *    persisting it — an invalid key is never stored;
 *  - map failures onto the `ConnectionState` machine that the UI renders.
 */

const log = createLogger("openrouter.session");

function stateFromError(error: unknown): ConnectionState {
  if (error instanceof AuthenticationError) return { status: "invalid-key" };
  if (error instanceof RateLimitError) {
    return { status: "rate-limited", retryAfterSeconds: error.retryAfterSeconds };
  }
  if (error instanceof NetworkError) return { status: "offline" };
  return { status: "error", message: toAppError(error).message };
}

class OpenRouterSession {
  readonly client = new OpenRouterClient(() => secretStorage.get(secretNames.openrouterApiKey));
  readonly provider = new OpenRouterVideoProvider(this.client);

  /** Restores the connection on app start from the stored key, if any. */
  async initialize(): Promise<void> {
    const key = await secretStorage.get(secretNames.openrouterApiKey).catch(() => null);
    if (key === null || key === "") {
      setConnectionState("openrouter", { status: "disconnected" });
      return;
    }
    await this.refresh({ showConnecting: true });
  }

  /**
   * Validates and stores a new API key. The key is checked against the
   * live API first; storage happens only after OpenRouter accepts it.
   */
  async connect(apiKey: string): Promise<AccountStatus> {
    const candidate = apiKey.trim();
    setConnectionState("openrouter", { status: "connecting" });
    try {
      await this.client.validateKey(candidate);
      await secretStorage.set(secretNames.openrouterApiKey, candidate);
      const account = await this.provider.getAccountStatus();
      setConnectionState("openrouter", { status: "connected", account });
      log.info("connected", { key: maskSecret(candidate) });
      return account;
    } catch (error) {
      setConnectionState("openrouter", stateFromError(error));
      log.warn("connect failed", { code: toAppError(error).code });
      throw error;
    }
  }

  /** Re-checks the stored key and refreshes account data. */
  async refresh(options: { showConnecting?: boolean } = {}): Promise<void> {
    if (options.showConnecting) {
      setConnectionState("openrouter", { status: "connecting" });
    }
    try {
      const account = await this.provider.getAccountStatus();
      setConnectionState("openrouter", { status: "connected", account });
    } catch (error) {
      setConnectionState("openrouter", stateFromError(error));
      log.warn("refresh failed", { code: toAppError(error).code });
    }
  }

  /** Forgets the stored key and resets the connection. */
  async disconnect(): Promise<void> {
    await secretStorage.remove(secretNames.openrouterApiKey);
    setConnectionState("openrouter", { status: "disconnected" });
    log.info("disconnected");
  }

  /** Masked form of the stored key for display ("sk-or-v1…a1b2"). */
  async getMaskedKey(): Promise<string | null> {
    const key = await secretStorage.get(secretNames.openrouterApiKey).catch(() => null);
    return key === null || key === "" ? null : maskSecret(key);
  }
}

export const openRouterSession = new OpenRouterSession();
