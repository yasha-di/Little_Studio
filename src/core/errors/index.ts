/**
 * Application error hierarchy.
 *
 * Every error thrown by Little Studio code extends `AppError`, so error
 * boundaries, loggers, retry policies and the connection state machine can
 * rely on a stable shape (`code`, `message`, `cause`) and on `instanceof`
 * checks instead of string matching. Throwing a bare `Error` is a bug.
 */
export class AppError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.code = code;
  }
}

/** Thrown by architectural stubs that are intentionally not implemented yet. */
export class NotImplementedError extends AppError {
  constructor(feature: string) {
    super("NOT_IMPLEMENTED", `${feature} is not implemented yet.`);
  }
}

/** The request never produced an HTTP response (DNS, refused, offline). */
export class NetworkError extends AppError {
  constructor(message = "Network request failed.", options?: ErrorOptions) {
    super("NETWORK", message, options);
  }
}

/** The request was aborted after exceeding its time budget. */
export class TimeoutError extends NetworkError {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms.`);
    // Own code: subclass constructor runs after super assigns "NETWORK".
    (this as { code: string }).code = "TIMEOUT";
    this.timeoutMs = timeoutMs;
  }
}

/** Missing, malformed or rejected credentials (HTTP 401/403). */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed: the API key was rejected.") {
    super("AUTHENTICATION", message);
  }
}

/** HTTP 429 — the provider asked us to slow down. */
export class RateLimitError extends AppError {
  /** Seconds to wait before retrying, when the provider reports it. */
  readonly retryAfterSeconds: number | null;

  constructor(retryAfterSeconds: number | null = null) {
    super("RATE_LIMITED", "Rate limited by the provider.");
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Data failed schema validation (API responses, stored data, forms). */
export class ValidationError extends AppError {
  readonly issues: readonly string[];

  constructor(message: string, issues: readonly string[] = []) {
    super("VALIDATION", message);
    this.issues = issues;
  }
}

/** A persistence operation failed (Tauri Store, localStorage, …). */
export class StorageError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super("STORAGE", message, options);
  }
}

/** Failures originating from a generation provider's API. */
export class ProviderError extends AppError {
  readonly providerId: string;
  /** HTTP status when the failure came from an HTTP response. */
  readonly status: number | null;

  constructor(
    providerId: string,
    code: string,
    message: string,
    options?: ErrorOptions & { status?: number | null },
  ) {
    super(code, message, options);
    this.providerId = providerId;
    this.status = options?.status ?? null;
  }
}

/** Normalizes unknown thrown values into an AppError for logging/reporting. */
export function toAppError(value: unknown): AppError {
  if (value instanceof AppError) return value;
  if (value instanceof Error) {
    return new AppError("UNKNOWN", value.message, { cause: value });
  }
  return new AppError("UNKNOWN", String(value));
}
