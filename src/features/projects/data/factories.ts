import {
  newId,
  nowIso,
  type Project,
  type ProjectId,
  type PromptContent,
  type Scene,
  type SceneGenerationDraft,
  type SceneLoopConfig,
} from "@/types";

/**
 * Entity factories — the single place where new domain objects are shaped.
 * Every default lives here so creation flows (button, shortcut, future
 * command palette) can never produce divergent records.
 */

export function emptyPromptContent(): PromptContent {
  return { text: "", negativeText: null, variables: [], metadata: {} };
}

export function defaultLoopConfig(): SceneLoopConfig {
  return { enabled: false, optimization: "none", notes: "" };
}

export function defaultGenerationDraft(modelId: string | null = null): SceneGenerationDraft {
  return {
    modelId,
    durationSeconds: null,
    resolution: null,
    aspectRatio: null,
    seed: null,
    generateAudio: false,
  };
}

export function makeProject(name: string): Project {
  const timestamp = nowIso();
  return {
    id: newId<"ProjectId">(),
    name,
    description: "",
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** "Scene 01", "Scene 02", … from a 0-based order. */
export function sceneNameForOrder(order: number): string {
  return `Scene ${String(order + 1).padStart(2, "0")}`;
}

export function makeScene(
  projectId: ProjectId,
  order: number,
  options: { name?: string; defaultModelId?: string | null } = {},
): Scene {
  const timestamp = nowIso();
  return {
    id: newId<"SceneId">(),
    projectId,
    name: options.name ?? sceneNameForOrder(order),
    order,
    prompt: emptyPromptContent(),
    tags: [],
    referenceImageIds: [],
    startImageId: null,
    endImageId: null,
    loop: defaultLoopConfig(),
    generation: defaultGenerationDraft(options.defaultModelId ?? null),
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Fills fields added after a scene was persisted (Sprint 2 extended the
 * schema). Merging over factory defaults at the read boundary means stored
 * data never needs an explicit migration step.
 */
export function normalizeScene(stored: Scene): Scene {
  // Records written before the schema extension genuinely lack these
  // fields at runtime, whatever the compile-time type claims.
  const raw: Partial<Scene> = stored;
  return {
    ...stored,
    prompt: { ...emptyPromptContent(), ...raw.prompt },
    tags: raw.tags ?? [],
    referenceImageIds: raw.referenceImageIds ?? [],
    startImageId: raw.startImageId ?? null,
    endImageId: raw.endImageId ?? null,
    loop: { ...defaultLoopConfig(), ...raw.loop },
    generation: { ...defaultGenerationDraft(), ...raw.generation },
    notes: raw.notes ?? "",
  };
}
