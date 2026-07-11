/**
 * Cross-cutting utility types shared by every layer.
 */

/**
 * Nominal (branded) ID types. A `ProjectId` cannot be passed where a
 * `CollectionId` is expected even though both are strings at runtime —
 * the compiler enforces domain boundaries for free.
 */
declare const brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand };

/** ISO-8601 timestamp string, e.g. "2026-07-02T12:00:00Z". */
export type IsoDateString = Brand<string, "IsoDateString">;

export const nowIso = (): IsoDateString => new Date().toISOString() as IsoDateString;

/** JSON-safe values — the only shape allowed in persisted metadata. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = Record<string, JsonValue>;

/** Discriminated result type for operations that can fail without throwing. */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
