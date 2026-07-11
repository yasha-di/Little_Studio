import { Film, Play } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { useT, type MessageKey } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * UI-level status vocabulary for the card. Deliberately NOT a domain type:
 * shared components stay domain-agnostic; features map their domain state
 * (job status + result presence) into this when rendering.
 */
type VideoCardStatus = "queued" | "generating" | "ready" | "failed";

const statusVariant: Record<VideoCardStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  queued: "secondary",
  generating: "warning",
  ready: "success",
  failed: "destructive",
};

const statusLabelKey: Record<VideoCardStatus, MessageKey> = {
  queued: "phase.queued",
  generating: "phase.generating",
  ready: "status.ready",
  failed: "phase.failed",
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

interface VideoCardProps extends React.ComponentProps<"article"> {
  videoTitle: string;
  /** Secondary line under the title (project name, date…). */
  subtitle?: string;
  status: VideoCardStatus;
  durationSeconds?: number;
  thumbnailUrl?: string;
  /** Real playable video; hover previews it muted, from the start. */
  videoSrc?: string;
  /** Opens the full preview; shown as a hover play overlay on the thumbnail. */
  onOpen?: () => void;
  /** Action affordances rendered next to the status badge. */
  actions?: React.ReactNode;
}

/**
 * Video card: metadata over a 16:9 preview area. With `videoSrc` set the
 * card shows the actual video (first frame as poster, muted hover play).
 */
function VideoCard({
  videoTitle,
  subtitle,
  status,
  durationSeconds,
  thumbnailUrl,
  videoSrc,
  onOpen,
  actions,
  className,
  ...props
}: VideoCardProps) {
  const t = useT();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  return (
    <article
      data-slot="video-card"
      className={cn(
        "group app-chrome flex flex-col overflow-hidden rounded-xl border bg-card shadow-raised transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-border-strong hover:shadow-overlay",
        className,
      )}
      {...props}
    >
      <div className="relative flex aspect-video items-center justify-center bg-surface-2">
        {videoSrc !== undefined ? (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            playsInline
            preload="metadata"
            className="size-full object-cover"
            onMouseEnter={() => void videoRef.current?.play().catch(() => undefined)}
            onMouseLeave={() => {
              const video = videoRef.current;
              if (video === null) return;
              video.pause();
              video.currentTime = 0;
            }}
          />
        ) : thumbnailUrl !== undefined ? (
          <img
            src={thumbnailUrl}
            alt={videoTitle}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <Film className="size-6 text-muted-foreground/50" />
        )}
        {durationSeconds !== undefined && (
          <span className="absolute right-2 bottom-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-2xs text-white/90">
            {formatDuration(durationSeconds)}
          </span>
        )}
        {onOpen !== undefined && (
          <button
            type="button"
            onClick={onOpen}
            aria-label={t("library.open", { title: videoTitle })}
            className={cn(
              "absolute inset-0 flex items-center justify-center outline-none",
              "opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/60 backdrop-blur-sm transition-transform duration-150 group-hover:scale-100 group-active:scale-95">
              <Play className="size-4 fill-white text-white" />
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium" title={videoTitle}>
            {videoTitle}
          </h3>
          {subtitle !== undefined && (
            <p className="truncate text-xs text-muted-foreground" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant={statusVariant[status]}>{t(statusLabelKey[status])}</Badge>
          {actions}
        </div>
      </div>
    </article>
  );
}

export { VideoCard, type VideoCardProps, type VideoCardStatus };
