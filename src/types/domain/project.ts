import { type IsoDateString } from "../common";
import { type ProjectId } from "./ids";

/**
 * Project — the top-level container of creative work.
 *
 * Scenes reference their project (`scene.projectId`); the project does NOT
 * store a scene list. One-directional ownership means adding a scene
 * touches one record, and the two can never disagree about membership.
 * Ordering lives on the scene (`scene.order`).
 */
export interface Project {
  id: ProjectId;
  name: string;
  description: string;
  /** Soft delete: archived projects are hidden, not destroyed. */
  archivedAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}
