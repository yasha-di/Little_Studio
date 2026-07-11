import { NetworkError, TimeoutError } from "@/core/errors";
import { createLogger } from "@/core/logging";

/**
 * Transport-level HTTP core.
 *
 * Owns exactly three concerns: time budgets, transient-failure retries and
 * network-error normalization. HTTP *semantics* (status → domain error,
 * response parsing) belong to API clients built on top — this separation
 * lets every future provider reuse the same battle-tested transport.
 */

const log = createLogger("http");

export interface RetryPolicy {
  /** Additional attempts after the first one. */
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface HttpFetchOptions {
  timeoutMs?: number;
  retry?: RetryPolicy;
  signal?: AbortSignal;
}

export const DEFAULT_TIMEOUT_MS = 15_000;

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  retries: 2,
  baseDelayMs: 400,
  maxDelayMs: 5_000,
};

/** Statuses that indicate a temporary condition worth retrying. */
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function backoffDelay(attempt: number, policy: RetryPolicy): number {
  const exponential = policy.baseDelayMs * 2 ** attempt;
  const capped = Math.min(policy.maxDelayMs, exponential);
  // Full jitter: spread retries out so bursts don't synchronize.
  return capped * (0.5 + Math.random() * 0.5);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new NetworkError("Request aborted."));
      },
      { once: true },
    );
  });
}

/** Reads a Retry-After header (seconds or HTTP date) into milliseconds. */
export function parseRetryAfterMs(response: Response): number | null {
  const header = response.headers.get("retry-after");
  if (header === null) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

async function attemptFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  outerSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  const onOuterAbort = () => {
    controller.abort();
  };
  outerSignal?.addEventListener("abort", onOuterAbort, { once: true });

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (outerSignal?.aborted) throw new NetworkError("Request aborted.", { cause: error });
    if (controller.signal.aborted) throw new TimeoutError(timeoutMs);
    // fetch rejects with TypeError on DNS failure, refused connection, CORS…
    throw new NetworkError("Network request failed.", { cause: error });
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", onOuterAbort);
  }
}

/**
 * `fetch` with a time budget and exponential-backoff retries for transient
 * failures (network errors, 408/429/5xx). Returns the final `Response`
 * even when it is not ok — mapping statuses to domain errors is the
 * caller's job. Throws `TimeoutError` / `NetworkError` when no response
 * could be obtained at all.
 */
export async function httpFetch(
  url: string,
  init: RequestInit = {},
  options: HttpFetchOptions = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const policy = options.retry ?? DEFAULT_RETRY_POLICY;

  let lastError: NetworkError | null = null;

  for (let attempt = 0; attempt <= policy.retries; attempt += 1) {
    if (attempt > 0) {
      const delay = backoffDelay(attempt - 1, policy);
      log.debug(`retrying request (attempt ${attempt + 1}/${policy.retries + 1})`, {
        url,
        delayMs: Math.round(delay),
      });
      await sleep(delay, options.signal);
    }

    let response: Response;
    try {
      response = await attemptFetch(url, init, timeoutMs, options.signal);
    } catch (error) {
      if (!(error instanceof NetworkError)) throw error;
      lastError = error;
      continue;
    }

    if (!RETRYABLE_STATUSES.has(response.status) || attempt === policy.retries) {
      return response;
    }

    // Respect Retry-After on 429/503 within a sane cap.
    const retryAfterMs = parseRetryAfterMs(response);
    if (retryAfterMs !== null && retryAfterMs > 0) {
      await sleep(Math.min(retryAfterMs, policy.maxDelayMs), options.signal);
    }
    log.debug(`retryable status ${response.status}`, { url });
  }

  throw lastError ?? new NetworkError("Network request failed.");
}
