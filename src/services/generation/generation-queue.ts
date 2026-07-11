import { AuthenticationError, NotImplementedError, RateLimitError } from "@/core/errors";
import { createLogger } from "@/core/logging";
import { type GenerationMode } from "@/services/capabilities";
import { saveVideoToLibrary } from "@/services/media";
import { pricingStrategy } from "@/services/pricing";
import { listProviders } from "@/services/providers";
import {
  type ProviderGenerationJob,
  type VideoGenerationProvider,
  type VideoGenerationRequest,
  type VideoModel,
} from "@/services/providers/types";
import {
  generationJobRepository,
  generationRepository,
  generationResultRepository,
  generationVersionRepository,
  historyRepository,
  referenceImageRepository,
  sceneRepository,
} from "@/services/repositories";
import {
  newId,
  nowIso,
  type ActivityEventKind,
  type Generation,
  type GenerationJob,
  type GenerationJobId,
  type GenerationResult,
  type GenerationVersion,
  type JobFailure,
  type PromptSnapshot,
  type ReferenceImageId,
  type Scene,
  type VersionOperation,
} from "@/types";

import { failureFromError, providerReportedFailure } from "./failures";
import { getTask, upsertTask } from "./queue-store";
import { type GenerationTask, type QueueEvent } from "./types";

/**
 * The generation queue — one service that owns the whole pipeline:
 *
 *   scene draft → Generation/Version/Job records → provider submit →
 *   polling → download → GenerationResult → repositories → live UI state.
 *
 * Deliberately single-concurrency this sprint: jobs run strictly one at a
 * time, but the queue accepts any number, persists everything through the
 * repositories, and resumes interrupted jobs on launch — so widening to N
 * concurrent runners later is a scheduling change, not an architecture
 * change. React reads live state from the queue store; server-state caches
 * are invalidated by subscribers of `subscribe()`.
 */

const log = createLogger("generation.queue");

const POLL_INTERVAL_MS = 10_000;
/** Give up watching a single job after this long (provider also expires). */
const MAX_POLL_DURATION_MS = 45 * 60_000;
/** Tolerated consecutive poll failures (transient network) before failing. */
const MAX_CONSECUTIVE_POLL_FAILURES = 30;

export interface EnqueueInput {
  /** The scene draft exactly as the user sees it (already autosaved). */
  scene: Scene;
  /** The resolved catalog model — capabilities gate what gets sent. */
  model: VideoModel;
  /** The creative mode chosen in the workspace — gates which guidance
   * frames ride along (a stale start image must not leak into Text→Video). */
  mode: GenerationMode;
}

class GenerationQueueService {
  private pending: GenerationJobId[] = [];
  private activeJobId: GenerationJobId | null = null;
  private readonly cancelRequested = new Set<GenerationJobId>();
  private readonly listeners = new Set<(event: QueueEvent) => void>();
  private wake: (() => void) | null = null;
  private initialized = false;

  subscribe(listener: (event: QueueEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Snapshots the scene draft into an immutable version, persists the job
   * and puts it in line. Returns immediately — the editor never waits.
   */
  async enqueue({ scene, model, mode }: EnqueueInput): Promise<GenerationTask> {
    const generation = await this.resolveGeneration(scene);
    const versions = await generationVersionRepository.listByGeneration(generation.id);

    const prompt: PromptSnapshot = structuredClone({
      text: scene.prompt.text,
      negativeText: scene.prompt.negativeText,
      variables: scene.prompt.variables,
      metadata: scene.prompt.metadata,
    });
    const usesStartImage = mode === "image-to-video" || mode === "start-end";
    const usesEndImage = mode === "start-end";
    const negativeText = scene.prompt.negativeText?.trim() ?? "";
    const settings: GenerationVersion["settings"] = {
      modelId: model.id,
      durationSeconds: scene.generation.durationSeconds,
      resolution: scene.generation.resolution,
      aspectRatio: scene.generation.aspectRatio,
      // Capability gating happens here, once: what the snapshot stores is
      // exactly what will be sent to the provider. Parameters are only sent
      // when the model *positively* reports support — "unknown" would risk
      // a validation reject of a paid request. Frames are additionally
      // gated by the chosen mode, so a stale image never rides along.
      seed: model.capabilities.seed === true ? scene.generation.seed : null,
      generateAudio: model.capabilities.audio === true ? scene.generation.generateAudio : null,
      negativePrompt:
        model.capabilities.negativePrompt === true && negativeText !== "" ? negativeText : null,
      startImageId: usesStartImage && model.capabilities.imageToVideo ? scene.startImageId : null,
      endImageId: usesEndImage && model.capabilities.endFrame ? scene.endImageId : null,
    };

    const parent =
      versions.find((v) => v.id === generation.activeVersionId) ?? versions.at(-1) ?? null;
    const operation = deriveOperation(parent, prompt, settings);

    const jobId = newId<"GenerationJobId">();
    const timestamp = nowIso();
    const version: GenerationVersion = {
      id: newId<"GenerationVersionId">(),
      generationId: generation.id,
      parentId: parent?.id ?? null,
      operation,
      number: (versions.at(-1)?.number ?? 0) + 1,
      label: null,
      prompt,
      settings,
      jobId,
      createdAt: timestamp,
    };

    const job: GenerationJob = {
      id: jobId,
      versionId: version.id,
      providerId: model.providerId,
      providerJobId: null,
      status: "queued",
      progress: null,
      cost: {
        estimate: pricingStrategy.estimate({
          model,
          durationSeconds: settings.durationSeconds,
          resolution: settings.resolution,
          aspectRatio: settings.aspectRatio,
          generateAudio: settings.generateAudio,
          mode: settings.startImageId !== null ? "image-to-video" : "text-to-video",
        }),
        actual: null,
      },
      timing: { queuedAt: timestamp, startedAt: null, finishedAt: null, generationTimeMs: null },
      failure: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await generationVersionRepository.save(version);
    await generationJobRepository.save(job);
    await generationRepository.save({
      ...generation,
      rootVersionId: generation.rootVersionId ?? version.id,
      activeVersionId: version.id,
      updatedAt: timestamp,
    });
    await this.appendHistory("version.created", `Version V${version.number} queued`, scene, {
      versionId: version.id,
    });

    const task: GenerationTask = {
      jobId,
      versionId: version.id,
      generationId: generation.id,
      sceneId: scene.id,
      projectId: scene.projectId,
      versionNumber: version.number,
      phase: "queued",
      progress: null,
      failure: null,
      actualCost: null,
      enqueuedAt: timestamp,
      updatedAt: timestamp,
    };
    this.emit(task);

    this.pending.push(jobId);
    void this.pump();
    return task;
  }

  /**
   * Cancels a queued or running job. OpenRouter has no cancel API, so a
   * running job is cancelled locally: polling stops, the record is closed.
   * Money already spent on the provider side is honestly lost.
   */
  async cancel(jobId: GenerationJobId): Promise<void> {
    this.cancelRequested.add(jobId);

    const queuedIndex = this.pending.indexOf(jobId);
    if (queuedIndex !== -1) {
      this.pending.splice(queuedIndex, 1);
      const task = getTask(jobId);
      if (task !== null) await this.finalizeCanceled(task);
      return;
    }
    // Running: wake the poll loop so it observes the flag immediately.
    if (this.activeJobId === jobId) this.wake?.();
  }

  /** Resumes jobs that were still active when the app last closed. */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const active = await generationJobRepository.listActive();
    if (active.length === 0) return;
    log.info(`resuming ${active.length} active job(s) from a previous session`);

    for (const job of [...active].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      const task = await this.rebuildTask(job);
      if (task === null) continue;
      if (job.providerJobId === null) {
        // Never reached the provider — nothing to poll, nothing was billed.
        await this.finalizeFailed(task, {
          code: "INTERRUPTED",
          message: "The app closed before this job reached the provider. Generate again.",
          retryable: true,
        });
        continue;
      }
      this.emit(task);
      this.pending.push(job.id);
    }
    void this.pump();
  }

  /* ---------------------------------------------------------------- */
  /* Internals                                                         */
  /* ---------------------------------------------------------------- */

  private emit(task: GenerationTask): void {
    upsertTask(task);
    for (const listener of this.listeners) listener({ task });
  }

  private touch(task: GenerationTask, patch: Partial<GenerationTask>): GenerationTask {
    const next = { ...task, ...patch, updatedAt: nowIso() };
    this.emit(next);
    return next;
  }

  private async pump(): Promise<void> {
    if (this.activeJobId !== null) return;
    const jobId = this.pending.shift();
    if (jobId === undefined) return;
    this.activeJobId = jobId;
    try {
      await this.run(jobId);
    } catch (error) {
      // Last-resort guard: run() handles its own failures; reaching this
      // means a bug, and the job must still be closed out, not stuck.
      log.error("unexpected queue error", { error });
      const task = getTask(jobId);
      if (task !== null) await this.finalizeFailed(task, failureFromError(error));
    } finally {
      this.activeJobId = null;
      void this.pump();
    }
  }

  private async run(jobId: GenerationJobId): Promise<void> {
    let task = getTask(jobId);
    let job = await generationJobRepository.getById(jobId);
    if (task === null || job === null) {
      log.error("job vanished before it could run", { jobId });
      return;
    }
    if (this.cancelRequested.has(jobId)) {
      await this.finalizeCanceled(task);
      return;
    }

    const provider = this.providerFor(job.providerId);
    if (provider === null) {
      await this.finalizeFailed(task, {
        code: "PROVIDER_NOT_FOUND",
        message: `Provider "${job.providerId}" is not available.`,
        retryable: false,
      });
      return;
    }

    // Submit — unless this is a resumed job that was already accepted.
    if (job.providerJobId === null) {
      let providerJob: ProviderGenerationJob;
      try {
        providerJob = await provider.createGeneration(await this.buildRequest(task));
      } catch (error) {
        await this.finalizeFailed(task, failureFromError(error));
        return;
      }
      job = {
        ...job,
        providerJobId: providerJob.id,
        status: "running",
        timing: { ...job.timing, startedAt: nowIso() },
        updatedAt: nowIso(),
      };
      await generationJobRepository.save(job);
      await this.appendHistoryForTask(
        "job.started",
        `Generation V${task.versionNumber} started`,
        task,
      );
      task = this.touch(task, { phase: providerStatusToPhase(providerJob.status) });
    } else {
      task = this.touch(task, { phase: "generating" });
    }

    await this.poll(task, job, provider);
  }

  private async poll(
    task: GenerationTask,
    job: GenerationJob,
    provider: VideoGenerationProvider,
  ): Promise<void> {
    const providerJobId = job.providerJobId;
    if (providerJobId === null) return; // unreachable; run() submitted above
    const startedPollingAt = Date.now();
    let consecutiveFailures = 0;

    for (;;) {
      if (this.cancelRequested.has(task.jobId)) {
        await this.cancelAtProvider(provider, providerJobId);
        await this.finalizeCanceled(task);
        return;
      }
      if (Date.now() - startedPollingAt > MAX_POLL_DURATION_MS) {
        await this.finalizeFailed(task, {
          code: "GENERATION_TIMEOUT",
          message: "The generation did not finish within 45 minutes and was abandoned.",
          retryable: true,
        });
        return;
      }

      await this.sleep(POLL_INTERVAL_MS);
      if (this.cancelRequested.has(task.jobId)) continue; // handled at loop top

      let providerJob: ProviderGenerationJob;
      try {
        providerJob = await provider.getGeneration(providerJobId);
        consecutiveFailures = 0;
      } catch (error) {
        if (error instanceof AuthenticationError) {
          await this.finalizeFailed(task, failureFromError(error));
          return;
        }
        if (error instanceof RateLimitError && error.retryAfterSeconds !== null) {
          await this.sleep(error.retryAfterSeconds * 1000);
          continue;
        }
        consecutiveFailures += 1;
        if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          await this.finalizeFailed(task, failureFromError(error));
          return;
        }
        log.warn("poll attempt failed; will retry", {
          jobId: task.jobId,
          attempt: consecutiveFailures,
        });
        continue;
      }

      switch (providerJob.status) {
        case "queued":
        case "running": {
          // Emit only on real change — a silent 10s tick is not an event.
          const phase = providerStatusToPhase(providerJob.status);
          if (phase !== task.phase || providerJob.progress !== task.progress) {
            task = this.touch(task, { phase, progress: providerJob.progress });
          }
          continue;
        }
        case "succeeded":
          await this.completeJob(task, job, provider, providerJob);
          return;
        case "failed":
          await this.finalizeFailed(task, providerReportedFailure(providerJob.failureReason));
          return;
        case "canceled":
          await this.finalizeCanceled(task);
          return;
      }
    }
  }

  /** succeeded at the provider → download, attach, close out. */
  private async completeJob(
    task: GenerationTask,
    job: GenerationJob,
    provider: VideoGenerationProvider,
    providerJob: ProviderGenerationJob,
  ): Promise<void> {
    task = this.touch(task, { phase: "downloading", progress: null });

    let result: GenerationResult;
    try {
      const blob = await provider.downloadResult(providerJob.id);
      const saved = await saveVideoToLibrary(task.versionId, blob);
      const version = await generationVersionRepository.getById(task.versionId);
      result = {
        versionId: task.versionId,
        videoUrl: providerJob.outputUrl ?? "",
        localPath: saved.localPath,
        thumbnailPath: null,
        // Requested duration/resolution; probing the actual file arrives
        // with the player work.
        durationSeconds: version?.settings.durationSeconds ?? null,
        resolution: version?.settings.resolution ?? null,
        fileSizeBytes: saved.fileSizeBytes,
        mimeType: saved.mimeType,
        createdAt: nowIso(),
      };
      await generationResultRepository.save(result);
    } catch (error) {
      const failure = failureFromError(error);
      await this.finalizeFailed(task, {
        ...failure,
        message: `The video was generated but could not be saved: ${failure.message}`,
        retryable: true,
      });
      return;
    }

    const finishedAt = nowIso();
    const actual =
      providerJob.costUsd === null
        ? null
        : { money: { amount: providerJob.costUsd, currency: "USD" }, creditsUsed: null };
    await generationJobRepository.save({
      ...job,
      providerJobId: providerJob.id,
      status: "succeeded",
      progress: null,
      cost: { ...job.cost, actual },
      timing: {
        ...job.timing,
        finishedAt,
        generationTimeMs:
          job.timing.startedAt === null
            ? null
            : Date.parse(finishedAt) - Date.parse(job.timing.startedAt),
      },
      failure: null,
      updatedAt: finishedAt,
    });
    await this.appendHistoryForTask(
      "job.succeeded",
      `Generation V${task.versionNumber} completed`,
      task,
    );
    this.touch(task, { phase: "completed", actualCost: actual });
  }

  private async finalizeFailed(task: GenerationTask, failure: JobFailure): Promise<void> {
    await this.closeJob(task.jobId, "failed", failure);
    await this.appendHistoryForTask(
      "job.failed",
      `Generation V${task.versionNumber} failed: ${failure.message}`,
      task,
    );
    this.touch(task, { phase: "failed", failure, progress: null });
  }

  private async finalizeCanceled(task: GenerationTask): Promise<void> {
    this.cancelRequested.delete(task.jobId);
    await this.closeJob(task.jobId, "canceled", null);
    await this.appendHistoryForTask(
      "job.canceled",
      `Generation V${task.versionNumber} canceled`,
      task,
    );
    this.touch(task, { phase: "canceled", progress: null });
  }

  private async closeJob(
    jobId: GenerationJobId,
    status: "failed" | "canceled",
    failure: JobFailure | null,
  ): Promise<void> {
    const job = await generationJobRepository.getById(jobId);
    if (job === null) return;
    const finishedAt = nowIso();
    await generationJobRepository.save({
      ...job,
      status,
      failure,
      timing: { ...job.timing, finishedAt },
      updatedAt: finishedAt,
    });
  }

  private async cancelAtProvider(
    provider: VideoGenerationProvider,
    providerJobId: string,
  ): Promise<void> {
    try {
      await provider.cancelGeneration(providerJobId);
    } catch (error) {
      if (!(error instanceof NotImplementedError)) {
        log.warn("provider-side cancel failed; cancelling locally", { error });
      }
    }
  }

  private async buildRequest(task: GenerationTask): Promise<VideoGenerationRequest> {
    const version = await generationVersionRepository.getById(task.versionId);
    if (version === null) {
      throw new Error("The saved take for this job no longer exists.");
    }
    const { settings, prompt } = version;

    // `?? null` guards: negativePrompt is absent on pre-V0.31 records.
    const negativePrompt = settings.negativePrompt ?? null;
    const request: VideoGenerationRequest = {
      modelId: settings.modelId,
      prompt: prompt.text,
      ...(negativePrompt !== null && { negativePrompt }),
      ...(settings.durationSeconds !== null && { durationSeconds: settings.durationSeconds }),
      ...(settings.resolution !== null && { resolution: settings.resolution }),
      ...(settings.aspectRatio !== null && { aspectRatio: settings.aspectRatio }),
      ...(settings.seed !== null && { seed: settings.seed }),
      ...(settings.generateAudio !== null && { generateAudio: settings.generateAudio }),
    };

    const startImageUrl = await this.resolveFrameUrl(settings.startImageId, "start");
    if (startImageUrl !== null) request.startImageUrl = startImageUrl;
    const endImageUrl = await this.resolveFrameUrl(settings.endImageId ?? null, "end");
    if (endImageUrl !== null) request.endImageUrl = endImageUrl;
    return request;
  }

  /** Loads a guidance frame's URL (https or data URL); a missing image
   * degrades to "not sent" with a warning, never a failed job. */
  private async resolveFrameUrl(
    imageId: ReferenceImageId | null,
    slot: "start" | "end",
  ): Promise<string | null> {
    if (imageId === null) return null;
    const image = await referenceImageRepository.getById(imageId);
    if (image !== null && image.source.kind === "url") return image.source.url;
    log.warn(`${slot} image is unavailable; generating without it`, { imageId });
    return null;
  }

  /** One generation per scene for now; created on first Generate. */
  private async resolveGeneration(scene: Scene): Promise<Generation> {
    const existing = await generationRepository.listByScene(scene.id);
    const first = existing[0];
    if (first !== undefined) return first;

    const timestamp = nowIso();
    const generation: Generation = {
      id: newId<"GenerationId">(),
      sceneId: scene.id,
      title: scene.name,
      rootVersionId: null,
      activeVersionId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await generationRepository.save(generation);
    await this.appendHistory("generation.created", `Generation started in "${scene.name}"`, scene, {
      generationId: generation.id,
    });
    return generation;
  }

  private providerFor(providerId: string): VideoGenerationProvider | null {
    return listProviders().find((p) => p.info.id === providerId) ?? null;
  }

  /** Rebuilds the live task for a persisted job (resume path). */
  private async rebuildTask(job: GenerationJob): Promise<GenerationTask | null> {
    const version = await generationVersionRepository.getById(job.versionId);
    const generation =
      version === null ? null : await generationRepository.getById(version.generationId);
    const scene = generation === null ? null : await sceneRepository.getById(generation.sceneId);
    if (version === null || generation === null || scene === null) {
      log.warn("dropping active job with missing context", { jobId: job.id });
      const finishedAt = nowIso();
      await generationJobRepository.save({
        ...job,
        status: "failed",
        failure: {
          code: "CONTEXT_MISSING",
          message: "The scene or version behind this job was deleted.",
          retryable: false,
        },
        timing: { ...job.timing, finishedAt },
        updatedAt: finishedAt,
      });
      return null;
    }
    return {
      jobId: job.id,
      versionId: version.id,
      generationId: generation.id,
      sceneId: scene.id,
      projectId: scene.projectId,
      versionNumber: version.number,
      phase: job.status === "queued" ? "queued" : "generating",
      progress: null,
      failure: null,
      actualCost: null,
      enqueuedAt: job.timing.queuedAt,
      updatedAt: nowIso(),
    };
  }

  private appendHistoryForTask(
    kind: ActivityEventKind,
    message: string,
    task: GenerationTask,
  ): Promise<void> {
    return historyRepository
      .append({
        id: newId<"ActivityEventId">(),
        kind,
        message,
        context: {
          projectId: task.projectId,
          sceneId: task.sceneId,
          generationId: task.generationId,
          versionId: task.versionId,
          jobId: task.jobId,
        },
        occurredAt: nowIso(),
      })
      .catch((error: unknown) => {
        log.warn("failed to append history event", { error });
      });
  }

  private appendHistory(
    kind: ActivityEventKind,
    message: string,
    scene: Scene,
    context: Record<string, string>,
  ): Promise<void> {
    return historyRepository
      .append({
        id: newId<"ActivityEventId">(),
        kind,
        message,
        context: { projectId: scene.projectId, sceneId: scene.id, ...context },
        occurredAt: nowIso(),
      })
      .catch((error: unknown) => {
        log.warn("failed to append history event", { error });
      });
  }

  /** Interruptible sleep: `cancel()` wakes the loop instantly. */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.wake = null;
        resolve();
      }, ms);
      this.wake = () => {
        clearTimeout(timer);
        this.wake = null;
        resolve();
      };
    });
  }
}

/** provider "queued" renders as Queued; anything running as Generating. */
function providerStatusToPhase(status: ProviderGenerationJob["status"]): "queued" | "generating" {
  return status === "queued" ? "queued" : "generating";
}

/** regenerate = same creative content as the parent; remix = it changed. */
function deriveOperation(
  parent: GenerationVersion | null,
  prompt: PromptSnapshot,
  settings: GenerationVersion["settings"],
): VersionOperation {
  if (parent === null) return "initial";
  const sameContent =
    parent.prompt.text === prompt.text &&
    parent.prompt.negativeText === prompt.negativeText &&
    parent.settings.modelId === settings.modelId &&
    parent.settings.durationSeconds === settings.durationSeconds &&
    parent.settings.resolution === settings.resolution &&
    parent.settings.aspectRatio === settings.aspectRatio &&
    parent.settings.generateAudio === settings.generateAudio &&
    parent.settings.startImageId === settings.startImageId &&
    (parent.settings.endImageId ?? null) === settings.endImageId;
  return sameContent ? "regenerate" : "remix";
}

export const generationQueue = new GenerationQueueService();
