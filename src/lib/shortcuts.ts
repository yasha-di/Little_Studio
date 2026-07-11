/**
 * Keyboard shortcut vocabulary — the single source of truth.
 *
 * Definitions live here (pure data, no React) so that key handling, menus,
 * tooltips and the future command palette all render the same combo and can
 * never drift apart. Handlers are bound where the action lives via
 * `useShortcut`; an id without a live handler is a declared-but-pending
 * shortcut, which is exactly how placeholders are expressed.
 */

export type ShortcutId =
  "new-project" | "new-scene" | "generate" | "focus-prompt" | "search" | "open-settings";

export interface KeyCombo {
  /** `KeyboardEvent.key`, lowercase for letters ("n", "enter", ","). */
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface ShortcutDef {
  id: ShortcutId;
  label: string;
  combo: KeyCombo;
}

export const shortcuts: Record<ShortcutId, ShortcutDef> = {
  "new-project": {
    id: "new-project",
    label: "New project",
    combo: { key: "n", ctrl: true, shift: true },
  },
  "new-scene": { id: "new-scene", label: "New scene", combo: { key: "n", ctrl: true } },
  generate: { id: "generate", label: "Generate", combo: { key: "enter", ctrl: true } },
  "focus-prompt": { id: "focus-prompt", label: "Focus prompt", combo: { key: "l", ctrl: true } },
  search: { id: "search", label: "Search", combo: { key: "k", ctrl: true } },
  "open-settings": { id: "open-settings", label: "Open settings", combo: { key: ",", ctrl: true } },
};

const isMac =
  typeof navigator !== "undefined" && /mac/i.test(navigator.platform || navigator.userAgent);

const KEY_LABELS: Record<string, string> = {
  enter: "↵",
  ",": ",",
};

/** Human-readable combo ("Ctrl+Shift+N", "⌘↵") for tooltips and menus. */
export function formatCombo(combo: KeyCombo): string {
  const parts: string[] = [];
  if (combo.ctrl) parts.push(isMac ? "⌘" : "Ctrl");
  if (combo.shift) parts.push(isMac ? "⇧" : "Shift");
  if (combo.alt) parts.push(isMac ? "⌥" : "Alt");
  parts.push(KEY_LABELS[combo.key] ?? combo.key.toUpperCase());
  return parts.join(isMac ? "" : "+");
}

export function formatShortcut(id: ShortcutId): string {
  return formatCombo(shortcuts[id].combo);
}

/** True when the event matches the combo exactly (no extra modifiers). */
export function matchesCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
  const ctrl = event.ctrlKey || event.metaKey;
  return (
    event.key.toLowerCase() === combo.key &&
    ctrl === Boolean(combo.ctrl) &&
    event.shiftKey === Boolean(combo.shift) &&
    event.altKey === Boolean(combo.alt)
  );
}
