import { createStorage } from "@/services/persistence";
import {
  TERMINAL_JOB_STATUSES,
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

import { StorageCollectionRepository } from "./storage-collection-repository";
import {
  type AppSettings,
  type GenerationJobRepository,
  type GenerationRepository,
  type GenerationResultRepository,
  type GenerationVersionRepository,
  type HistoryRepository,
  type ProjectRepository,
  type ReferenceImageRepository,
  type SceneRepository,
  type SettingsRepository,
  type TemplateRepository,
} from "./types";

export { StorageCollectionRepository };
export type {
  AppSettings,
  GenerationJobRepository,
  GenerationRepository,
  GenerationResultRepository,
  GenerationVersionRepository,
  HistoryRepository,
  ProjectRepository,
  ReferenceImageRepository,
  SceneRepository,
  SettingsRepository,
  TemplateRepository,
};

/**
 * Repository instances — the composition happens once, here.
 *
 * Storage layout: creative data lives in "workspace" (one JSON store),
 * settings in "settings", history in "history". Separate namespaces keep
 * unrelated write frequencies apart (a progress update never rewrites
 * your projects file).
 */
const workspace = createStorage("workspace");
const settingsStorage = createStorage("settings");
const historyStorage = createStorage("history");

class SceneStorageRepository
  extends StorageCollectionRepository<Scene, SceneId>
  implements SceneRepository
{
  async listByProject(projectId: ProjectId): Promise<Scene[]> {
    const scenes = await this.list();
    return scenes.filter((s) => s.projectId === projectId).sort((a, b) => a.order - b.order);
  }
}

class GenerationStorageRepository
  extends StorageCollectionRepository<Generation, GenerationId>
  implements GenerationRepository
{
  async listByScene(sceneId: SceneId): Promise<Generation[]> {
    const generations = await this.list();
    return generations.filter((g) => g.sceneId === sceneId);
  }
}

class GenerationVersionStorageRepository
  extends StorageCollectionRepository<GenerationVersion, GenerationVersionId>
  implements GenerationVersionRepository
{
  async listByGeneration(generationId: GenerationId): Promise<GenerationVersion[]> {
    const versions = await this.list();
    return versions
      .filter((v) => v.generationId === generationId)
      .sort((a, b) => a.number - b.number);
  }
}

class GenerationJobStorageRepository
  extends StorageCollectionRepository<GenerationJob, GenerationJobId>
  implements GenerationJobRepository
{
  async listActive(): Promise<GenerationJob[]> {
    const jobs = await this.list();
    return jobs.filter((job) => !TERMINAL_JOB_STATUSES.has(job.status));
  }
}

/**
 * Results keyed by version id (1:1). Not a `StorageCollectionRepository`
 * because `GenerationResult` has no `id` of its own — the version is the key.
 */
class GenerationResultStorageRepository implements GenerationResultRepository {
  private readonly key = "generation-results";

  private async readAll(): Promise<Record<string, GenerationResult>> {
    return (await workspace.get<Record<string, GenerationResult>>(this.key)) ?? {};
  }

  async getByVersion(versionId: GenerationVersionId): Promise<GenerationResult | null> {
    const records = await this.readAll();
    return records[versionId] ?? null;
  }

  async list(): Promise<GenerationResult[]> {
    return Object.values(await this.readAll());
  }

  async save(result: GenerationResult): Promise<void> {
    const records = await this.readAll();
    records[result.versionId] = result;
    await workspace.set(this.key, records);
  }

  async removeByVersion(versionId: GenerationVersionId): Promise<void> {
    const records = await this.readAll();
    if (!(versionId in records)) return;
    const { [versionId]: _removed, ...rest } = records;
    await workspace.set(this.key, rest);
  }
}

const SETTINGS_KEY = "app";

const DEFAULT_SETTINGS: AppSettings = {
  defaultProviderId: "openrouter",
  defaultModelId: null,
  autoDownloadResults: true,
};

class SettingsStorageRepository implements SettingsRepository {
  async load(): Promise<AppSettings> {
    const stored = await settingsStorage.get<Partial<AppSettings>>(SETTINGS_KEY);
    // Merge over defaults so new settings fields never require migration.
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  async save(settings: AppSettings): Promise<void> {
    await settingsStorage.set(SETTINGS_KEY, settings);
  }
}

const HISTORY_KEY = "events";
/** History is capped: it is a feed, not an audit log. */
const HISTORY_LIMIT = 1000;

class HistoryStorageRepository implements HistoryRepository {
  async append(event: ActivityEvent): Promise<void> {
    const events = (await historyStorage.get<ActivityEvent[]>(HISTORY_KEY)) ?? [];
    events.push(event);
    await historyStorage.set(HISTORY_KEY, events.slice(-HISTORY_LIMIT));
  }

  async list(options?: { limit?: number }): Promise<ActivityEvent[]> {
    const events = (await historyStorage.get<ActivityEvent[]>(HISTORY_KEY)) ?? [];
    const newestFirst = [...events].reverse();
    return options?.limit === undefined ? newestFirst : newestFirst.slice(0, options.limit);
  }

  async clear(): Promise<void> {
    await historyStorage.remove(HISTORY_KEY);
  }
}

export const projectRepository: ProjectRepository = new StorageCollectionRepository<
  Project,
  ProjectId
>(workspace, "projects");
export const sceneRepository: SceneRepository = new SceneStorageRepository(workspace, "scenes");
export const generationRepository: GenerationRepository = new GenerationStorageRepository(
  workspace,
  "generations",
);
export const generationVersionRepository: GenerationVersionRepository =
  new GenerationVersionStorageRepository(workspace, "generation-versions");
export const generationJobRepository: GenerationJobRepository = new GenerationJobStorageRepository(
  workspace,
  "generation-jobs",
);
export const generationResultRepository: GenerationResultRepository =
  new GenerationResultStorageRepository();
export const referenceImageRepository: ReferenceImageRepository = new StorageCollectionRepository<
  ReferenceImage,
  ReferenceImageId
>(workspace, "reference-images");
export const templateRepository: TemplateRepository = new StorageCollectionRepository<
  PromptTemplate,
  PromptTemplateId
>(workspace, "prompt-templates");
export const settingsRepository: SettingsRepository = new SettingsStorageRepository();
export const historyRepository: HistoryRepository = new HistoryStorageRepository();
