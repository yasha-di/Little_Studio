import { create } from "zustand";

import { type GenerationJobId, type GenerationVersionId, type SceneId } from "@/types";

import { TERMINAL_PHASES, type GenerationTask } from "./types";

/**
 * Live generation state, readable from React.
 *
 * This is client state driven by the queue service (same pattern as the
 * provider connection store): the service writes, components subscribe.
 * Tasks stay in the store after finishing so the session keeps showing
 * results/failures; persisted truth lives in the job repository.
 */
interface QueueStoreState {
  tasks: Record<GenerationJobId, GenerationTask>;
  /** Enqueue order — stable rendering for a future queue panel. */
  order: GenerationJobId[];
  upsertTask: (task: GenerationTask) => void;
}

export const useQueueStore = create<QueueStoreState>()((set) => ({
  tasks: {},
  order: [],
  upsertTask: (task) => {
    set((state) => ({
      tasks: { ...state.tasks, [task.jobId]: task },
      order: state.order.includes(task.jobId) ? state.order : [...state.order, task.jobId],
    }));
  },
}));

/** Non-React accessor for the queue service. */
export function upsertTask(task: GenerationTask): void {
  useQueueStore.getState().upsertTask(task);
}

export function getTask(jobId: GenerationJobId): GenerationTask | null {
  return useQueueStore.getState().tasks[jobId] ?? null;
}

/** The task the scene cares about right now: active first, else newest. */
export function selectSceneTask(state: QueueStoreState, sceneId: SceneId): GenerationTask | null {
  let newest: GenerationTask | null = null;
  for (const jobId of state.order) {
    const task = state.tasks[jobId];
    if (task?.sceneId !== sceneId) continue;
    if (!TERMINAL_PHASES.has(task.phase)) return task;
    newest = task;
  }
  return newest;
}

export function selectVersionTask(
  state: QueueStoreState,
  versionId: GenerationVersionId,
): GenerationTask | null {
  for (const jobId of state.order) {
    const task = state.tasks[jobId];
    if (task?.versionId === versionId) return task;
  }
  return null;
}
