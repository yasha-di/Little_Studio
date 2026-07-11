import { create } from "zustand";

/**
 * Global UI chrome state — window-level concerns that outlive any route:
 * sidebar collapse, workspace panel layout, command palette, etc.
 *
 * Feature/server data does NOT belong here: server state lives in TanStack
 * Query, feature-local state lives inside the feature. When persistence
 * lands, this store gains a `persist` middleware wired to
 * `services/persistence` under `storageKeys.uiPreferences`.
 */

/** react-resizable-panels layout: panel id → percentage (0..100). */
type PanelLayout = Record<string, number>;

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  /**
   * Workspace panel sizes per panel-group id. Kept here so switching scenes
   * (which remounts the workspace panels) never loses the user's layout.
   */
  panelLayouts: Record<string, PanelLayout>;
  setPanelLayout: (groupId: string, layout: PanelLayout) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },
  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },
  panelLayouts: {},
  setPanelLayout: (groupId, layout) => {
    set((state) => ({ panelLayouts: { ...state.panelLayouts, [groupId]: layout } }));
  },
}));
