import { type GenerationVersion, type GenerationVersionId } from "@/types";

/**
 * Pure functions over the generation version tree.
 *
 * Versions store only `parentId` (like git commits); everything else —
 * children, branches, lineage — is derived here. Keeping derivation in one
 * pure module means the tree UI, the extend workflow and future pruning
 * logic all share identical semantics, and all of it is trivially testable
 * without storage or React.
 */

export interface VersionNode {
  version: GenerationVersion;
  children: VersionNode[];
}

export interface VersionTree {
  root: VersionNode | null;
  /** Versions whose parent is missing from the input (data corruption). */
  orphans: GenerationVersion[];
}

function byCreation(a: GenerationVersion, b: GenerationVersion): number {
  return a.number - b.number;
}

/** Builds the child index: parentId → children, ordered by version number. */
export function childrenIndex(
  versions: readonly GenerationVersion[],
): Map<GenerationVersionId | null, GenerationVersion[]> {
  const index = new Map<GenerationVersionId | null, GenerationVersion[]>();
  for (const version of versions) {
    const siblings = index.get(version.parentId) ?? [];
    siblings.push(version);
    index.set(version.parentId, siblings);
  }
  for (const siblings of index.values()) siblings.sort(byCreation);
  return index;
}

/** Assembles the full tree from a flat version list. */
export function buildVersionTree(versions: readonly GenerationVersion[]): VersionTree {
  const byId = new Map(versions.map((v) => [v.id, v]));
  const index = childrenIndex(versions);

  const attach = (version: GenerationVersion): VersionNode => ({
    version,
    children: (index.get(version.id) ?? []).map(attach),
  });

  const roots = index.get(null) ?? [];
  const orphans = versions.filter((v) => v.parentId !== null && !byId.has(v.parentId));

  return {
    root: roots[0] ? attach(roots[0]) : null,
    orphans,
  };
}

/** Direct children of a version. */
export function getChildren(
  versions: readonly GenerationVersion[],
  parentId: GenerationVersionId,
): GenerationVersion[] {
  return childrenIndex(versions).get(parentId) ?? [];
}

/**
 * Path from the root down to (and including) the given version —
 * the version's full ancestry, oldest first. For an extend chain this is
 * the sequence of clips that plays back-to-back.
 */
export function getLineage(
  versions: readonly GenerationVersion[],
  versionId: GenerationVersionId,
): GenerationVersion[] {
  const byId = new Map(versions.map((v) => [v.id, v]));
  const lineage: GenerationVersion[] = [];
  let current = byId.get(versionId);
  const seen = new Set<GenerationVersionId>();

  while (current) {
    if (seen.has(current.id)) break; // cycle guard: corrupt data must not hang the app
    seen.add(current.id);
    lineage.unshift(current);
    current = current.parentId === null ? undefined : byId.get(current.parentId);
  }
  return lineage;
}

/** Versions with no children — the tips of every branch (like git leaf refs). */
export function getLeaves(versions: readonly GenerationVersion[]): GenerationVersion[] {
  const parents = new Set(versions.map((v) => v.parentId).filter((id) => id !== null));
  return versions.filter((v) => !parents.has(v.id)).sort(byCreation);
}

/** Next display number for a new version within a generation. */
export function nextVersionNumber(versions: readonly GenerationVersion[]): number {
  return versions.reduce((max, v) => Math.max(max, v.number), 0) + 1;
}

/**
 * Depth of a version (root = 0). Extend chains use this to show how many
 * segments precede a clip.
 */
export function getDepth(
  versions: readonly GenerationVersion[],
  versionId: GenerationVersionId,
): number {
  return Math.max(0, getLineage(versions, versionId).length - 1);
}
