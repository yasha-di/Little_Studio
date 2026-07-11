import { motion } from "framer-motion";
import { EllipsisVertical, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router";

import { ProjectCard } from "@/components/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Modal,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { useShortcut } from "@/hooks";
import { useT, type MessageKey, type Translate } from "@/i18n";
import { useRegisterCommand } from "@/lib/commands";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { formatShortcut } from "@/lib/shortcuts";
import { type Project } from "@/types";

import { WelcomeHero } from "../components/welcome-hero";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useSceneCounts,
} from "../data/use-projects";

/** Time-of-day greeting — the studio welcomes its director back. */
function greeting(t: Translate): string {
  const hour = new Date().getHours();
  const key: MessageKey =
    hour < 5
      ? "projects.greeting.late"
      : hour < 12
        ? "projects.greeting.morning"
        : hour < 18
          ? "projects.greeting.afternoon"
          : "projects.greeting.evening";
  return t(key);
}

/**
 * The home screen: a creative studio welcome, not an entity list.
 * "New project" creates immediately (no naming dialog — rename inline
 * inside the workspace) and drops the creator straight into the first
 * scene: one click from idea to writing a prompt.
 */
export function ProjectsPage() {
  const t = useT();
  const navigate = useNavigate();
  const projects = useProjects();
  const sceneCounts = useSceneCounts();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [pendingDelete, setPendingDelete] = React.useState<Project | null>(null);

  const handleCreate = React.useCallback(() => {
    if (createProject.isPending) return;
    createProject.mutate("Untitled project", {
      onSuccess: ({ project, scene }) => {
        void navigate(`/projects/${project.id}/scenes/${scene.id}`);
      },
    });
  }, [createProject, navigate]);

  useShortcut("new-project", handleCreate);
  useRegisterCommand({
    id: "project.new",
    title: "New project",
    group: "Projects",
    shortcutId: "new-project",
    run: handleCreate,
  });

  // First launch: no workspace chrome, no empty grid — one welcoming
  // screen whose single action starts the guided path to a first video.
  if (projects.data?.length === 0) {
    return <WelcomeHero onCreate={handleCreate} creating={createProject.isPending} />;
  }

  return (
    <div className="flex h-full flex-col gap-7 overflow-y-auto p-7">
      <header className="app-chrome flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-2xs font-medium tracking-[0.18em] text-primary uppercase select-none">
            Little Studio
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{greeting(t)}</h1>
          <p className="text-sm text-muted-foreground">{t("projects.subtitle")}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="lg" onClick={handleCreate} loading={createProject.isPending}>
              <Plus />
              {t("projects.new")}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{formatShortcut("new-project")}</TooltipContent>
        </Tooltip>
      </header>

      {projects.isPending ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : projects.isError ? (
        <p className="text-sm text-destructive">
          {t("projects.loadError", { message: projects.error.message })}
        </p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4"
        >
          {projects.data.map((project) => (
            <motion.div key={project.id} variants={staggerItem} className="group relative">
              <button
                type="button"
                onClick={() => {
                  void navigate(`/projects/${project.id}`);
                }}
                className="w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ProjectCard
                  name={project.name}
                  description={project.description}
                  sceneCount={sceneCounts.data?.get(project.id) ?? 0}
                  updatedAt={project.updatedAt}
                  posterSeed={project.id}
                />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("projects.actionsFor", { name: project.name })}
                    className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                  >
                    <EllipsisVertical className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => {
                      setPendingDelete(project);
                    }}
                  >
                    <Trash2 /> {t("projects.deleteConfirm")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={t("projects.deleteTitle", { name: pendingDelete?.name ?? "" })}
        description={t("projects.deleteDescription")}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setPendingDelete(null);
              }}
            >
              {t("composer.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete !== null) deleteProject.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              {t("projects.deleteConfirm")}
            </Button>
          </>
        }
      />
    </div>
  );
}
