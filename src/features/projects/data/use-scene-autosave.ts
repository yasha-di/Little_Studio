import { useCallback, useEffect, useRef, useState } from "react";

import { type Scene } from "@/types";

import { useUpdateScene } from "./use-scenes";

const AUTOSAVE_DELAY_MS = 600;

export type ScenePatch = Partial<Omit<Scene, "id" | "projectId" | "createdAt" | "updatedAt">>;

/**
 * Keystroke-level editing state for one scene, persisted automatically.
 *
 * The editor works against a local draft (instant, uncontrolled by the
 * network) while writes debounce into the repository in the background —
 * there is no Save button anywhere in the workspace, by design. Mount the
 * consuming component with `key={scene.id}` so switching scenes remounts
 * the hook; the pending write is flushed on unmount, so nothing is lost.
 */
export function useAutosaveScene(scene: Scene) {
  const [draft, setDraft] = useState(scene);
  const updateScene = useUpdateScene(scene.projectId);

  const draftRef = useRef(scene);
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<Scene | null>(null);
  // The mutation object changes identity per render; keep the latest in a
  // ref so flush-on-unmount doesn't retrigger the effect.
  const mutateRef = useRef(updateScene.mutate);
  useEffect(() => {
    mutateRef.current = updateScene.mutate;
  });

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current !== null) {
      mutateRef.current(pendingRef.current);
      pendingRef.current = null;
    }
  }, []);

  const patch = useCallback(
    (partial: ScenePatch) => {
      const next = { ...draftRef.current, ...partial };
      draftRef.current = next;
      pendingRef.current = next;
      setDraft(next);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(flush, AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  useEffect(() => flush, [flush]);

  return { draft, patch, flush, isSaving: updateScene.isPending };
}
