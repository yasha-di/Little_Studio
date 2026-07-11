import { motion } from "framer-motion";
import {
  Copy,
  Download,
  EllipsisVertical,
  FolderOpen,
  Play,
  Search as SearchIcon,
  SearchX,
  TriangleAlert,
  Video,
} from "lucide-react";
import * as React from "react";
import { NavLink } from "react-router";

import { EmptyState, VideoCard } from "@/components/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Modal,
  Skeleton,
} from "@/components/ui";
import { useI18n, type Translate } from "@/i18n";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { copyText } from "@/lib/utils";
import {
  canRevealInFolder,
  revealInFolder,
  saveVideoCopy,
  videoPreviewSrc,
} from "@/services/media";

import { useLibraryVideos, type LibraryVideo } from "../data/use-library-videos";

function videoTitle(entry: LibraryVideo, t: Translate): string {
  const take =
    entry.version === null ? "" : ` · ${t("take.number", { number: entry.version.number })}`;
  return `${entry.sceneName ?? t("library.untitledScene")}${take}`;
}

function VideoActions({
  entry,
  onPreview,
  onError,
}: {
  entry: LibraryVideo;
  onPreview: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useI18n();
  const src = videoPreviewSrc(entry.result);
  const prompt = entry.version?.prompt.text ?? null;

  const run = (action: () => Promise<unknown>) => {
    void action().catch((error: unknown) => {
      onError(error instanceof Error ? error.message : String(error));
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("library.videoActions")}>
          <EllipsisVertical className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={src === null} onSelect={onPreview}>
          <Play />
          {t("common.preview")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            run(() => saveVideoCopy(entry.result, videoTitle(entry, t)));
          }}
        >
          <Download />
          {t("common.download")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canRevealInFolder(entry.result)}
          onSelect={() => {
            run(() => revealInFolder(entry.result));
          }}
        >
          <FolderOpen />
          {t("common.openLocation")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={prompt === null}
          onSelect={() => {
            if (prompt !== null) void copyText(prompt);
          }}
        >
          <Copy />
          {t("common.copyPrompt")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The Videos category of the Library: every generated clip across all
 * projects, playable in place, with Download / Open location / Copy prompt.
 */
export function VideosGallery() {
  const { t, tCount } = useI18n();
  const videos = useLibraryVideos();
  const [preview, setPreview] = React.useState<LibraryVideo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  if (videos.isPending) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-video rounded-xl" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (videos.isError) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title={t("library.loadError")}
        description={videos.error.message}
      />
    );
  }

  if (videos.data.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title={t("library.empty")}
        description={t("library.emptyDescription")}
        action={
          <Button asChild variant="secondary">
            <NavLink to="/projects">{t("library.openProjects")}</NavLink>
          </Button>
        }
      />
    );
  }

  const previewSrc = preview === null ? null : videoPreviewSrc(preview.result);

  const q = query.trim().toLowerCase();
  const filtered =
    q === ""
      ? videos.data
      : videos.data.filter(
          (entry) =>
            videoTitle(entry, t).toLowerCase().includes(q) ||
            (entry.projectName?.toLowerCase().includes(q) ?? false),
        );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-72">
          <SearchIcon
            aria-hidden="true"
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60"
          />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder={t("library.search")}
            aria-label={t("library.search")}
            className="pl-8"
          />
        </div>
        <span className="shrink-0 font-mono text-2xs text-muted-foreground/60">
          {tCount("library.clips", filtered.length)}
        </span>
      </div>
      {error !== null && <p className="text-xs text-destructive">{error}</p>}
      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t("library.noMatches")}
          description={t("library.noMatchesDescription", { query: query.trim() })}
          className="min-h-48"
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
        >
          {filtered.map((entry) => {
            const src = videoPreviewSrc(entry.result);
            return (
              <motion.div key={entry.result.versionId} variants={staggerItem}>
                <VideoCard
                  videoTitle={videoTitle(entry, t)}
                  {...(entry.projectName !== null && { subtitle: entry.projectName })}
                  status="ready"
                  {...(entry.result.durationSeconds !== null && {
                    durationSeconds: entry.result.durationSeconds,
                  })}
                  {...(src !== null && { videoSrc: src })}
                  {...(src !== null && {
                    onOpen: () => {
                      setPreview(entry);
                    },
                  })}
                  actions={
                    <VideoActions
                      entry={entry}
                      onPreview={() => {
                        setPreview(entry);
                      }}
                      onError={setError}
                    />
                  }
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        title={preview === null ? t("common.preview") : videoTitle(preview, t)}
        size="xl"
      >
        {previewSrc !== null && (
          <video src={previewSrc} controls autoPlay className="w-full rounded-lg bg-black" />
        )}
      </Modal>
    </div>
  );
}
