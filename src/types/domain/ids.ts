import { type Brand } from "../common";

/**
 * Branded entity IDs. All are UUID strings at runtime, but the compiler
 * refuses to let a SceneId flow into a GenerationId parameter — domain
 * boundaries are enforced for free at compile time.
 */
export type ProjectId = Brand<string, "ProjectId">;
export type SceneId = Brand<string, "SceneId">;
export type GenerationId = Brand<string, "GenerationId">;
export type GenerationVersionId = Brand<string, "GenerationVersionId">;
export type GenerationJobId = Brand<string, "GenerationJobId">;
export type ReferenceImageId = Brand<string, "ReferenceImageId">;
export type PromptId = Brand<string, "PromptId">;
export type PromptTemplateId = Brand<string, "PromptTemplateId">;
export type CollectionId = Brand<string, "CollectionId">;
export type ActivityEventId = Brand<string, "ActivityEventId">;

export const newId = <T extends string>(): Brand<string, T> =>
  crypto.randomUUID() as Brand<string, T>;
