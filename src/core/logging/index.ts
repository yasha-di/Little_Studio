import * as tauriLog from "@tauri-apps/plugin-log";

import { appConfig } from "@/core/config";

/**
 * Application logger.
 *
 * - In the Tauri shell, entries are forwarded to tauri-plugin-log, which
 *   writes stdout + a rotating file in the platform log directory.
 * - In plain browser dev, entries go to the console.
 * - Secrets are redacted before anything is written: an API key must never
 *   reach a log sink, even at debug level.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

/** Matches OpenRouter-style keys and generic bearer tokens. */
const SECRET_PATTERNS = [/sk-or-[A-Za-z0-9-_]+/g, /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g];

export function redactSecrets(text: string): string {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}

function serializeContext(context: Record<string, unknown> | undefined): string {
  if (!context || Object.keys(context).length === 0) return "";
  try {
    return ` ${JSON.stringify(context)}`;
  } catch {
    return " [unserializable context]";
  }
}

function write(level: LogLevel, scope: string, message: string, context?: Record<string, unknown>) {
  const line = redactSecrets(`[${scope}] ${message}${serializeContext(context)}`);

  if (appConfig.isTauri) {
    // Fire-and-forget: logging must never become a failure source.
    void tauriLog[level](line).catch(() => undefined);
    return;
  }

  console[level === "debug" ? "debug" : level](line);
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/** Creates a scoped logger; `scope` prefixes every entry (e.g. "openrouter"). */
export function createLogger(scope: string): Logger {
  return {
    debug: (message, context) => {
      if (appConfig.isDev) write("debug", scope, message, context);
    },
    info: (message, context) => {
      write("info", scope, message, context);
    },
    warn: (message, context) => {
      write("warn", scope, message, context);
    },
    error: (message, context) => {
      write("error", scope, message, context);
    },
  };
}
