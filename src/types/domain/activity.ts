import { type IsoDateString, type JsonObject } from "../common";
import { type ActivityEventId } from "./ids";

/**
 * Append-only history feed. Events are facts about the past — they are
 * never updated or deleted, which is why they get their own repository
 * with an append/list API instead of generic CRUD.
 */

export type ActivityEventKind =
  | "project.created"
  | "project.archived"
  | "scene.created"
  | "generation.created"
  | "version.created"
  | "job.started"
  | "job.succeeded"
  | "job.failed"
  | "job.canceled"
  | "provider.connected"
  | "provider.disconnected";

export interface ActivityEvent {
  id: ActivityEventId;
  kind: ActivityEventKind;
  message: string;
  /** Entity references for deep-linking (projectId, versionId, …). */
  context: JsonObject;
  occurredAt: IsoDateString;
}
