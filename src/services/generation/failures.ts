import {
  AuthenticationError,
  NetworkError,
  ProviderError,
  RateLimitError,
  TimeoutError,
  ValidationError,
  toAppError,
} from "@/core/errors";
import { type JobFailure } from "@/types";

/**
 * Error → user-facing `JobFailure` translation.
 *
 * The UI never sees a raw exception: every failure carries a stable code
 * (for styling/filtering), a sentence a person can act on, and whether
 * retrying the same request can plausibly succeed.
 */
export function failureFromError(error: unknown): JobFailure {
  if (error instanceof AuthenticationError) {
    return {
      code: "AUTHENTICATION",
      message: "OpenRouter rejected the API key. Reconnect the provider in Preferences.",
      retryable: false,
    };
  }
  if (error instanceof RateLimitError) {
    const wait =
      error.retryAfterSeconds === null ? "" : ` Try again in ~${error.retryAfterSeconds}s.`;
    return {
      code: "RATE_LIMITED",
      message: `The provider is rate-limiting requests.${wait}`,
      retryable: true,
    };
  }
  if (error instanceof TimeoutError) {
    return {
      code: "TIMEOUT",
      message: "The provider did not respond in time. Check your connection and retry.",
      retryable: true,
    };
  }
  if (error instanceof NetworkError) {
    return {
      code: "NETWORK",
      message: "Network problem while talking to the provider. Check your connection and retry.",
      retryable: true,
    };
  }
  if (error instanceof ValidationError) {
    // Includes the provider's own 400 reason ("duration must be one of…").
    return { code: "VALIDATION", message: error.message, retryable: false };
  }
  if (error instanceof ProviderError) {
    if (error.status === 402) {
      return {
        code: "INSUFFICIENT_CREDITS",
        message: "Not enough OpenRouter credits for this generation. Top up and retry.",
        retryable: false,
      };
    }
    return {
      code: error.code,
      message: `The provider reported an error: ${error.message}`,
      retryable: error.status !== null && error.status >= 500,
    };
  }
  const app = toAppError(error);
  return { code: app.code, message: app.message, retryable: false };
}

/** Failure for a generation the provider itself marked as failed. */
export function providerReportedFailure(reason: string | null): JobFailure {
  return {
    code: "GENERATION_FAILED",
    message: reason ?? "The provider could not generate this video.",
    retryable: true,
  };
}
