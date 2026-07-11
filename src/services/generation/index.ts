/**
 * Public API of the generation service. Components consume it through the
 * hooks layer (`hooks/use-generation-queue`); the queue singleton itself is
 * for the composition root and feature data hooks.
 */
export { generationQueue, type EnqueueInput } from "./generation-queue";
export { getTask, selectSceneTask, selectVersionTask, useQueueStore } from "./queue-store";
export {
  TERMINAL_PHASES,
  type GenerationPhase,
  type GenerationTask,
  type QueueEvent,
} from "./types";
