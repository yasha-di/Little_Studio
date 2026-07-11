import { type ProviderId } from "@/services/providers/types";
import {
  type ActivityEvent,
  type Generation,
  type GenerationId,
  type GenerationJob,
  type GenerationJobId,
  type GenerationResult,
  type GenerationVersion,
  type GenerationVersionId,
  type Project,
  type ProjectId,
  type PromptTemplate,
  type PromptTemplateId,
  type ReferenceImage,
  type ReferenceImageId,
  type Scene,
  type SceneId,
} from "@/types";

/**
 * Repository contracts — the only door between the app and persisted data.
 *
 * Consumers (stores, hooks, future features) depend on these interfaces;
 * the storage engine behind them (Tauri Store today, SQLite when the data
 * outgrows JSON) is an implementation detail that can change per
 * repository without touching a single consumer.
 */

/** Generic CRUD over an entity collection. `save` is an upsert. */
export interface Repository<TEntity extends { id: TId }, TId extends string> {
  getById(id: TId): Promise<TEntity | null>;
  list(): Promise<TEntity[]>;
  save(entity: TEntity): Promise<void>;
  remove(id: TId): Promise<void>;
}

export type ProjectRepository = Repository<Project, ProjectId>;

export interface SceneRepository extends Repository<Scene, SceneId> {
  /** Scenes of a project ordered by `scene.order`. */
  listByProject(projectId: ProjectId): Promise<Scene[]>;
}

export interface GenerationRepository extends Repository<Generation, GenerationId> {
  listByScene(sceneId: SceneId): Promise<Generation[]>;
}

export interface GenerationVersionRepository extends Repository<
  GenerationVersion,
  GenerationVersionId
> {
  /** Flat version list of one generation — input for `lib/version-tree`. */
  listByGeneration(generationId: GenerationId): Promise<GenerationVersion[]>;
}

export interface GenerationJobRepository extends Repository<GenerationJob, GenerationJobId> {
  /** Jobs that are not in a terminal status (for resume-on-launch). */
  listActive(): Promise<GenerationJob[]>;
}

/**
 * Results are keyed by their version (1:1 — a version has at most one
 * artifact), so this is not a generic `Repository`: the id IS the version.
 */
export interface GenerationResultRepository {
  getByVersion(versionId: GenerationVersionId): Promise<GenerationResult | null>;
  /** Every stored result — the media library's source of truth. */
  list(): Promise<GenerationResult[]>;
  save(result: GenerationResult): Promise<void>;
  removeByVersion(versionId: GenerationVersionId): Promise<void>;
}

export type ReferenceImageRepository = Repository<ReferenceImage, ReferenceImageId>;

export type TemplateRepository = Repository<PromptTemplate, PromptTemplateId>;

/** User-configurable application settings (defaults applied on load). */
export interface AppSettings {
  defaultProviderId: ProviderId;
  /** Preferred model, once the user picks one. */
  defaultModelId: string | null;
  /** Auto-download finished videos into the local media library. */
  autoDownloadResults: boolean;
}

export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}

/** Append-only activity feed. Events are never mutated. */
export interface HistoryRepository {
  append(event: ActivityEvent): Promise<void>;
  /** Newest first. */
  list(options?: { limit?: number }): Promise<ActivityEvent[]>;
  clear(): Promise<void>;
}
