import { type IsoDateString } from "../common";
import { type CollectionId, type GenerationVersionId } from "./ids";

/**
 * Collection — a user-curated set of finished versions gathered across
 * projects ("Best takes", "Client review"). Unlike scenes, membership is
 * an explicit list here because a version can belong to many collections.
 */
export interface Collection {
  id: CollectionId;
  name: string;
  description: string;
  versionIds: GenerationVersionId[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}
