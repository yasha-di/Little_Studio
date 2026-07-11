import { type IsoDateString, type JsonObject } from "../common";
import { type PromptId, type PromptTemplateId } from "./ids";

/**
 * Prompt system.
 *
 * `PromptContent` is the value-object shared by live prompts, templates and
 * the immutable snapshots stored inside generation versions. Text length is
 * unbounded by design; providers that impose limits enforce them at the
 * provider boundary, not in the domain.
 */

/** Declared placeholder inside prompt text, e.g. `{{subject}}`. Resolution
 *  is a future feature; the schema exists now so stored prompts are already
 *  forward-compatible. */
export interface PromptVariable {
  name: string;
  description: string;
  defaultValue: string | null;
}

export interface PromptContent {
  text: string;
  negativeText: string | null;
  variables: PromptVariable[];
  /** Free-form, provider-agnostic extras (style presets, camera notes…). */
  metadata: JsonObject;
}

/** A living, editable prompt attached to workspace entities. */
export interface Prompt extends PromptContent {
  id: PromptId;
  tags: string[];
  notes: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/** Reusable starting point for new prompts. */
export interface PromptTemplate extends PromptContent {
  id: PromptTemplateId;
  name: string;
  description: string;
  tags: string[];
  /** Built-in templates ship with the app and cannot be deleted. */
  builtIn: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/**
 * Immutable copy of prompt content captured at generation time. A version's
 * history must survive later edits to the source prompt — same reason a git
 * commit stores a tree, not a reference to your working directory.
 */
export type PromptSnapshot = Readonly<PromptContent>;
