import { useT } from "@/i18n";
import { type GenerationMode } from "@/services/capabilities";
import { type GenerationVersionId, type Scene } from "@/types";

import { type GenerateControl } from "../data/use-generate";
import { type ScenePatch } from "../data/use-scene-autosave";
import { EditorSection } from "./editor-section";
import { ExtendSource } from "./extend-source";
import { FramesSection } from "./frames-section";
import { PromptEditor } from "./prompt-editor";
import { TagInput } from "./tag-input";

interface SceneEditorProps {
  draft: Scene;
  patch: (partial: ScenePatch) => void;
  /** Generation control — rendered inside the prompt composer. */
  control: GenerateControl;
  /** The active generation mode; decides which guidance sections exist. */
  mode: GenerationMode;
  extendSourceId: GenerationVersionId | null;
  onSelectExtendSource: (versionId: GenerationVersionId) => void;
}

/**
 * The center workspace: one continuous, scrollable writing surface for a
 * scene. Everything autosaves through `patch`; there is no Save button.
 * The column adapts to the generation mode — image guidance only exists
 * in image-driven modes, the extend source picker only in Extend.
 * Machine parameters (model, duration, seed…) intentionally live in the
 * Inspector — this column is where films are written and generated.
 */
function SceneEditor({
  draft,
  patch,
  control,
  mode,
  extendSourceId,
  onSelectExtendSource,
}: SceneEditorProps) {
  const t = useT();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-7 py-6">
      <div className="flex flex-col gap-2">
        <input
          value={draft.name}
          onChange={(event) => {
            patch({ name: event.target.value });
          }}
          placeholder={t("editor.sceneName")}
          spellCheck={false}
          aria-label={t("editor.sceneName")}
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40"
        />
        <TagInput
          tags={draft.tags}
          onChange={(tags) => {
            patch({ tags });
          }}
        />
      </div>

      <PromptEditor
        text={draft.prompt.text}
        negativeText={draft.prompt.negativeText}
        onTextChange={(text) => {
          patch({ prompt: { ...draft.prompt, text } });
        }}
        onNegativeTextChange={(negativeText) => {
          patch({ prompt: { ...draft.prompt, negativeText } });
        }}
        control={control}
      />

      {(mode === "image-to-video" || mode === "start-end") && (
        <FramesSection draft={draft} patch={patch} mode={mode} />
      )}

      {mode === "extend" && (
        <ExtendSource sceneId={draft.id} value={extendSourceId} onChange={onSelectExtendSource} />
      )}

      <EditorSection title={t("editor.notes")}>
        <textarea
          value={draft.notes}
          onChange={(event) => {
            patch({ notes: event.target.value });
          }}
          placeholder={t("editor.notesPlaceholder")}
          spellCheck={false}
          className="field-sizing-content min-h-16 w-full resize-none rounded-lg border border-transparent bg-surface-1 px-3.5 py-2.5 text-sm leading-6 transition-colors outline-none placeholder:text-muted-foreground/50 hover:border-input/60 focus-visible:border-input"
        />
      </EditorSection>
    </div>
  );
}

export { SceneEditor };
