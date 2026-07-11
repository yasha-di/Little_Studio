import { motion } from "framer-motion";
import {
  Clapperboard,
  Library,
  type LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router";

import { AboutDialog, SectionLabel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { appConfig } from "@/core/config";
import { useDisclosure, useProjects } from "@/hooks";
import { useT, type MessageKey } from "@/i18n";
import { useRegisterCommand } from "@/lib/commands";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores";

interface NavItem {
  to: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  /** Match only the exact path, not descendants (NavLink `end`). */
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: "/projects", labelKey: "nav.projects", icon: Clapperboard, end: true },
  { to: "/library", labelKey: "nav.library", icon: Library },
  { to: "/settings", labelKey: "nav.preferences", icon: Settings },
];

const EXPANDED_WIDTH = 224;
const COLLAPSED_WIDTH = 52;

/** How many recently-touched projects the rail lists. */
const RECENT_PROJECTS_LIMIT = 5;

const rowClass = cn(
  "group/link relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium text-sidebar-foreground transition-colors duration-150 outline-none",
  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  "focus-visible:ring-2 focus-visible:ring-ring/50",
);

/** The 2px accent bar that marks the active row. All rows share one
 * `layoutId`, so on navigation the bar glides to the new row instead of
 * blinking — one continuous element, Linear-style. */
function ActiveIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.span
      layoutId="sidebar-active-indicator"
      transition={transitions.fast}
      aria-hidden="true"
      className="absolute top-2 -left-2 h-4 w-0.5 rounded-full bg-primary"
    />
  );
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const t = useT();
  const link = (
    <NavLink
      to={item.to}
      end={item.end ?? false}
      className={({ isActive }) =>
        cn(
          rowClass,
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-raised",
          collapsed && "justify-center px-0",
        )
      }
    >
      {({ isActive }) => (
        <>
          {!collapsed && <ActiveIndicator active={isActive} />}
          <item.icon
            className={cn(
              "size-4 shrink-0 transition-colors duration-150",
              isActive ? "text-primary" : "text-muted-foreground group-hover/link:text-foreground",
            )}
          />
          {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Recently-touched projects, one hop away (Linear-style). Reads the same
 * query cache as the Projects page — no extra fetching, no new state.
 */
function RecentProjects() {
  const t = useT();
  const projects = useProjects();
  const recent = (projects.data ?? []).slice(0, RECENT_PROJECTS_LIMIT);

  if (recent.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 pt-4">
      <SectionLabel className="px-2 pb-1 text-muted-foreground/60">{t("nav.recent")}</SectionLabel>
      {recent.map((project) => (
        <NavLink
          key={project.id}
          to={`/projects/${project.id}`}
          className={({ isActive }) =>
            cn(
              rowClass,
              "font-normal",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-raised",
            )
          }
        >
          {({ isActive }) => (
            <>
              <ActiveIndicator active={isActive} />
              <span
                aria-hidden="true"
                className={cn(
                  "ml-1 size-1.5 shrink-0 rounded-full transition-colors duration-150",
                  isActive
                    ? "bg-primary"
                    : "bg-muted-foreground/40 group-hover/link:bg-muted-foreground/70",
                )}
              />
              <span className="truncate">{project.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}

function Sidebar() {
  const t = useT();
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const about = useDisclosure();

  useRegisterCommand({
    id: "app.about",
    title: `About ${appConfig.name}`,
    group: "Application",
    run: about.open,
  });

  return (
    <motion.aside
      data-slot="sidebar"
      initial={false}
      animate={{ width: sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={transitions.slow}
      className="app-chrome flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar"
    >
      <nav
        aria-label={t("nav.primaryAria")}
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2"
      >
        {!sidebarCollapsed && (
          <SectionLabel className="px-2 pt-1 pb-1.5 text-muted-foreground/60">
            {t("nav.studio")}
          </SectionLabel>
        )}
        {navItems.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={sidebarCollapsed} />
        ))}
        {!sidebarCollapsed && <RecentProjects />}
      </nav>

      <div
        className={cn(
          "flex items-center gap-2 border-t border-sidebar-border p-2",
          sidebarCollapsed ? "justify-center" : "justify-between",
        )}
      >
        {!sidebarCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={about.open}
                className="rounded-sm px-2 font-mono text-2xs text-muted-foreground/60 transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                v{appConfig.version}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {t("nav.aboutTooltip", { name: appConfig.name })}
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={sidebarCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {sidebarCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
          </TooltipContent>
        </Tooltip>
      </div>

      <AboutDialog open={about.isOpen} onOpenChange={about.setIsOpen} />
    </motion.aside>
  );
}

export { Sidebar };
