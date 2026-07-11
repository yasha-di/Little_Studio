import { ImagePlus, X } from "lucide-react";
import * as React from "react";

import { Button, Spinner, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { useVideoModels } from "@/hooks/use-openrouter";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { modelSupports, type CapabilityId, type GenerationMode } from "@/services/capabilities";
import { type ReferenceImageId, type Scene } from "@/types";

import { useImportReferenceImage, useReferenceImage } from "../data/use-reference-images";
import { type ScenePatch } from "../data/use-scene-autosave";
import { EditorSection } from "./editor-section";

/**
 * Frame guidance UI, rendered only in image-driven modes. Image to Video
 * shows the start frame; Start → End adds the end frame. Both slots gate
 * themselves on the selected model's reported capabilities.
 */

interface SlotCopy {
  labelKey: "frames.startFrame" | "frames.endFrame";
  removeKey: "frames.removeStart" | "frames.removeEnd";
  guidesKey: "frames.hintGuides" | "frames.hintEndGuides";
  noSupportKey: "frames.hintNoSupport" | "frames.hintEndNoSupport";
  capability: CapabilityId;
  field: "startImageId" | "endImageId";
  dropzone: string;
}

const SLOTS: Record<"start" | "end", SlotCopy> = {
  start: {
    labelKey: "frames.startFrame",
    removeKey: "frames.removeStart",
    guidesKey: "frames.hintGuides",
    noSupportKey: "frames.hintNoSupport",
    capability: "image-to-video",
    field: "startImageId",
    dropzone: "start-frame",
  },
  end: {
    labelKey: "frames.endFrame",
    removeKey: "frames.removeEnd",
    guidesKey: "frames.hintEndGuides",
    noSupportKey: "frames.hintEndNoSupport",
    capability: "end-image",
    field: "endImageId",
    dropzone: "end-frame",
  },
};

function FrameSlot({
  draft,
  patch,
  slot,
}: {
  draft: Scene;
  patch: (p: ScenePatch) => void;
  slot: "start" | "end";
}) {
  const t = useT();
  const copy = SLOTS[slot];
  const models = useVideoModels();
  const model = models.data?.find((m) => m.id === draft.generation.modelId) ?? null;
  const supported = model !== null && modelSupports(model, copy.capability) === true;

  const imageId: ReferenceImageId | null = draft[copy.field];
  const image = useReferenceImage(imageId);
  const importImage = useImportReferenceImage();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (file === undefined) return;
    setError(null);
    importImage.mutate(file, {
      onSuccess: (imported) => {
        patch({ [copy.field]: imported.id });
      },
      onError: (mutationError) => {
        setError(mutationError.message);
      },
    });
  };

  const source = imageId === null ? null : (image.data?.source ?? null);
  const imageUrl = source?.kind === "url" ? source.url : null;

  const hint =
    model === null
      ? t("frames.hintChooseModel")
      : supported
        ? t(copy.guidesKey)
        : t(copy.noSupportKey, { model: model.name });

  return (
    <div className="flex w-44 flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {imageUrl !== null ? (
        <div className="group relative aspect-video w-full overflow-hidden rounded-lg border">
          <img src={imageUrl} alt={t(copy.labelKey)} className="size-full object-cover" />
          <Button
            variant="secondary"
            size="icon-sm"
            aria-label={t(copy.removeKey)}
            className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => {
              patch({ [copy.field]: null });
            }}
          >
            <X className="size-3.5" />
          </Button>
          <span className="absolute bottom-1 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-3xs text-white/90">
            {t(copy.labelKey)}
          </span>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="w-full">
              <button
                type="button"
                disabled={!supported || importImage.isPending}
                onClick={() => inputRef.current?.click()}
                data-dropzone={copy.dropzone}
                className={cn(
                  "flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input/80 bg-surface-1 transition-colors outline-none",
                  "hover:border-input hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring/50",
                  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-input/80 disabled:hover:bg-surface-1",
                )}
              >
                {importImage.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  <ImagePlus className="size-4 text-muted-foreground/70" />
                )}
                <span className="text-2xs text-muted-foreground">
                  {t("frames.addImage")}
                  {slot === "end" && ` — ${t("frames.endFrame").toLocaleLowerCase()}`}
                </span>
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56">
            {hint}
          </TooltipContent>
        </Tooltip>
      )}
      {error !== null && <p className="text-2xs leading-snug text-destructive">{error}</p>}
    </div>
  );
}

function FramesSection({
  draft,
  patch,
  mode,
}: {
  draft: Scene;
  patch: (p: ScenePatch) => void;
  mode: GenerationMode;
}) {
  const t = useT();
  const startEnd = mode === "start-end";
  return (
    <EditorSection title={startEnd ? t("frames.frames") : t("frames.startFrame")}>
      <div className="flex flex-wrap items-start gap-3">
        <FrameSlot draft={draft} patch={patch} slot="start" />
        {startEnd && <FrameSlot draft={draft} patch={patch} slot="end" />}
      </div>
    </EditorSection>
  );
}

export { FramesSection };
