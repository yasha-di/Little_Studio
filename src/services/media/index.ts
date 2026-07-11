import { appConfig } from "@/core/config";
import { StorageError } from "@/core/errors";
import { createLogger } from "@/core/logging";
import { type GenerationResult, type GenerationVersionId } from "@/types";

// Environment-agnostic core API (no IPC on import) — safe to bundle always.
import { convertFileSrc } from "@tauri-apps/api/core";

/**
 * Media library — where generated artifacts live on disk.
 *
 * Desktop (Tauri): videos are written to `<app-data>/media/videos/` and
 * served to <video> elements through the asset protocol. Browser dev has no
 * file system, so the blob is kept as an in-memory object URL for the
 * session — honest degradation, clearly reported by `localPath: null`.
 *
 * Tauri plugin modules are imported lazily inside the `isTauri` branches so
 * the browser bundle never evaluates them.
 */

const log = createLogger("media");

const VIDEO_DIR = "media/videos";

export interface SavedVideo {
  /** Absolute path on disk; null when running without a file system. */
  localPath: string | null;
  fileSizeBytes: number;
  mimeType: string;
}

/** Session-scoped object URLs for browser dev (and as a live-preview cache). */
const objectUrls = new Map<GenerationVersionId, string>();

/** Persists a finished video into the media library. */
export async function saveVideoToLibrary(
  versionId: GenerationVersionId,
  blob: Blob,
): Promise<SavedVideo> {
  const mimeType = blob.type === "" ? "video/mp4" : blob.type;

  // Keep an object URL either way: it previews instantly, even mid-session
  // in the browser where nothing is written to disk.
  const previous = objectUrls.get(versionId);
  if (previous !== undefined) URL.revokeObjectURL(previous);
  objectUrls.set(versionId, URL.createObjectURL(blob));

  if (!appConfig.isTauri) {
    log.warn("no file system outside the Tauri shell — video kept in memory only");
    return { localPath: null, fileSizeBytes: blob.size, mimeType };
  }

  try {
    const { BaseDirectory, mkdir, writeFile } = await import("@tauri-apps/plugin-fs");
    const { appDataDir, join } = await import("@tauri-apps/api/path");

    await mkdir(VIDEO_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
    const fileName = `${versionId}.mp4`;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    await writeFile(`${VIDEO_DIR}/${fileName}`, bytes, { baseDir: BaseDirectory.AppData });

    const localPath = await join(await appDataDir(), VIDEO_DIR, fileName);
    log.info("video saved", { path: localPath, bytes: blob.size });
    return { localPath, fileSizeBytes: blob.size, mimeType };
  } catch (error) {
    throw new StorageError("Could not write the video into the media library.", { cause: error });
  }
}

/**
 * A URL the <video> element can play: the asset protocol for files on disk,
 * or the session's object URL as a fallback. Null = nothing playable.
 */
export function videoPreviewSrc(result: GenerationResult): string | null {
  const objectUrl = objectUrls.get(result.versionId);
  if (result.localPath !== null && appConfig.isTauri) {
    return convertFileSrc(result.localPath);
  }
  return objectUrl ?? null;
}

/** True when "reveal in file manager" can work in this environment. */
export function canRevealInFolder(result: GenerationResult): boolean {
  return appConfig.isTauri && result.localPath !== null;
}

/** Opens the OS file manager with the video selected. */
export async function revealInFolder(result: GenerationResult): Promise<void> {
  if (!canRevealInFolder(result) || result.localPath === null) {
    throw new StorageError("The video has no local file to reveal.");
  }
  const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
  await revealItemInDir(result.localPath);
}

/**
 * "Download" (save a copy): native save dialog + file copy on desktop,
 * an <a download> click on the object URL in the browser.
 * Resolves to false when the user cancelled the dialog.
 */
export async function saveVideoCopy(
  result: GenerationResult,
  suggestedName: string,
): Promise<boolean> {
  const fileName = `${sanitizeFileName(suggestedName)}.mp4`;

  if (appConfig.isTauri && result.localPath !== null) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const target = await save({
      defaultPath: fileName,
      filters: [{ name: "MP4 video", extensions: ["mp4"] }],
    });
    if (target === null) return false;
    const { copyFile } = await import("@tauri-apps/plugin-fs");
    await copyFile(result.localPath, target);
    return true;
  }

  const objectUrl = objectUrls.get(result.versionId);
  if (objectUrl === undefined) {
    throw new StorageError("The video is not available in this session anymore.");
  }
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  return true;
}

function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned === "" ? "video" : cleaned.slice(0, 80);
}
