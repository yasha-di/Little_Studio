import { useEffect, useRef } from "react";

import { matchesCombo, shortcuts, type ShortcutId } from "@/lib/shortcuts";

interface UseShortcutOptions {
  /** Temporarily suspend the binding (e.g. while a dialog is open). */
  enabled?: boolean;
}

/**
 * Binds a handler to a declared shortcut for the lifetime of the component.
 *
 * All app shortcuts are modifier-based, so they intentionally fire even
 * while an input or the prompt editor has focus — a creator's hands should
 * never have to leave the keyboard or the text field.
 */
export function useShortcut(
  id: ShortcutId,
  handler: (event: KeyboardEvent) => void,
  { enabled = true }: UseShortcutOptions = {},
): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;

    const combo = shortcuts[id].combo;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!matchesCombo(event, combo)) return;
      event.preventDefault();
      handlerRef.current(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [id, enabled]);
}
