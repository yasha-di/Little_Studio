import { type KeyValueStorage } from "@/services/persistence";

import { type Repository } from "./types";

/**
 * Generic repository over `KeyValueStorage`: one collection = one key
 * holding a `Record<id, entity>` map.
 *
 * Honest trade-off, documented: reads/writes are whole-collection and
 * unindexed. For a desktop app whose collections are user-created (tens to
 * hundreds of entities) this is well within budget, and the repository
 * interface is exactly what lets us swap SQLite in per-collection when a
 * dataset outgrows it. Single-window desktop ⇒ no concurrent writers.
 */
export class StorageCollectionRepository<
  TEntity extends { id: TId },
  TId extends string,
> implements Repository<TEntity, TId> {
  constructor(
    protected readonly storage: KeyValueStorage,
    protected readonly collectionKey: string,
  ) {}

  protected async readAll(): Promise<Record<string, TEntity>> {
    return (await this.storage.get<Record<string, TEntity>>(this.collectionKey)) ?? {};
  }

  protected async writeAll(records: Record<string, TEntity>): Promise<void> {
    await this.storage.set(this.collectionKey, records);
  }

  async getById(id: TId): Promise<TEntity | null> {
    const records = await this.readAll();
    return records[id] ?? null;
  }

  async list(): Promise<TEntity[]> {
    return Object.values(await this.readAll());
  }

  async save(entity: TEntity): Promise<void> {
    const records = await this.readAll();
    records[entity.id] = entity;
    await this.writeAll(records);
  }

  async remove(id: TId): Promise<void> {
    const records = await this.readAll();
    if (!(id in records)) return;
    const { [id]: _removed, ...rest } = records;
    await this.writeAll(rest);
  }
}
