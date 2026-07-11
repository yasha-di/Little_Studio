import { type GenerationVersion } from "@/types";

/**
 * What the Inspector is currently describing: the scene's live draft, or a
 * selected (immutable) take from the history panel.
 */
export type InspectorTarget = { kind: "draft" } | { kind: "version"; version: GenerationVersion };
