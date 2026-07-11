import * as React from "react";

import { type ShortcutId } from "@/lib/shortcuts";

/**
 * Command registry — the architecture seam for the future command palette
 * (Ctrl+K). No palette UI exists yet; this module only defines how commands
 * are registered so features can start contributing them at any time and
 * the palette becomes a pure-UI addition later.
 *
 * Design notes:
 * - Commands are registered imperatively (module scope) or through
 *   `useRegisterCommand` (component scope, auto-unregisters on unmount).
 * - `listCommands()` returns a stable snapshot; the palette will subscribe
 *   via `subscribe` when it lands.
 */

export interface AppCommand {
  /** Stable identifier, e.g. "project.new" or "scene.generate". */
  id: string;
  /** Human-readable title shown in the palette ("New project…"). */
  title: string;
  /** Optional palette section ("Projects", "Navigation"…). */
  group?: string;
  /** Existing keyboard shortcut this command mirrors, if any. */
  shortcutId?: ShortcutId;
  /** Whether the command is currently actionable. Defaults to enabled. */
  enabled?: () => boolean;
  run: () => void;
}

const commands = new Map<string, AppCommand>();
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** Registers (or replaces) a command. Returns an unregister function. */
export function registerCommand(command: AppCommand): () => void {
  commands.set(command.id, command);
  notify();
  return () => {
    if (commands.get(command.id) === command) {
      commands.delete(command.id);
      notify();
    }
  };
}

export function listCommands(): AppCommand[] {
  return [...commands.values()];
}

/** For the future palette: re-render when the registry changes. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Component-scoped registration: the command exists while the component is
 * mounted (e.g. "New scene" only inside a project workspace).
 */
export function useRegisterCommand(command: AppCommand): void {
  const ref = React.useRef(command);

  // Keep the latest handler without re-registering on every render.
  React.useEffect(() => {
    ref.current = command;
  });

  React.useEffect(() => {
    const initial = ref.current;
    const stable: AppCommand = {
      id: initial.id,
      title: initial.title,
      run: () => {
        ref.current.run();
      },
      enabled: () => ref.current.enabled?.() ?? true,
      ...(initial.group !== undefined && { group: initial.group }),
      ...(initial.shortcutId !== undefined && { shortcutId: initial.shortcutId }),
    };
    return registerCommand(stable);
  }, []);
}
