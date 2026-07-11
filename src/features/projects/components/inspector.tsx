import { Dice5, X } from "lucide-react";
import * as React from "react";

import { PanelHeader, SectionLabel } from "@/components/shared";
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import {
  estimateReasonText,
  priceLabelText,
  useFailureText,
  useGenerationJob,
  useGenerationResult,
  useVersionTask,
} from "@/hooks";
import { useVideoModels } from "@/hooks/use-openrouter";
import { useT, type MessageKey, type Translate } from "@/i18n";
import { formatSecondsHint, trimNumber } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { modelSupports, type GenerationMode } from "@/services/capabilities";
import {
  formatUsd,
  modelPriceLabel,
  perSecondRate,
  pricingStrategy,
  type EstimationInput,
} from "@/services/pricing";
import { getProvider, type VideoModel } from "@/services/providers";
import { unknownCost, type CostEstimate, type GenerationVersion, type Scene } from "@/types";

import { draftEstimationInput } from "../data/estimation";
import { type GenerateControl } from "../data/use-generate";
import { type ScenePatch } from "../data/use-scene-autosave";
import { type InspectorTarget } from "../workspace-types";
import { DurationInput } from "./duration-input";
import { LockedFeatures } from "./locked-features";
import { ModeSelector } from "./mode-selector";
import { ModelPicker } from "./model-picker";
import { phaseBadgeVariant, phaseLabelKey } from "./phase-badge";

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

/** One titled section of the control panel. Quiet by design: hairline
 * dividers instead of boxed cards, so the inspector reads as one column of
 * settings — creative software, not an admin form. */
function InspectorGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 border-b border-border/60 px-4 py-4 last:border-b-0">
      <h3>
        <SectionLabel>{title}</SectionLabel>
      </h3>
      {children}
    </section>
  );
}

/** Scrollable body that stacks the sections edge-to-edge. */
function InspectorBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function InspectorRow({
  label,
  children,
  stacked = false,
}: {
  label: string;
  children: React.ReactNode;
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground select-none">{label}</span>
        {children}
      </div>
    );
  }
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <span className="shrink-0 text-xs text-muted-foreground select-none">{label}</span>
      <div className="flex max-w-44 min-w-0 flex-1 items-center justify-end">{children}</div>
    </div>
  );
}

function ReadonlyValue({ children }: { children: React.ReactNode }) {
  return <span className="truncate text-right font-mono text-xs text-foreground">{children}</span>;
}

/** Select when the model constrains the value, free input when it doesn't. */
function SelectOrInput({
  label,
  value,
  options,
  placeholder,
  onChange,
  optionHint,
}: {
  label: string;
  value: string | null;
  options: string[] | null;
  placeholder: string;
  onChange: (value: string | null) => void;
  /** Right-aligned annotation per option (e.g. its price). */
  optionHint?: ((option: string) => string | null) | undefined;
}) {
  const t = useT();
  if (options !== null && options.length > 0) {
    const stale = value !== null && !options.includes(value);
    return (
      <Select
        value={value ?? ""}
        onValueChange={(next) => {
          onChange(next);
        }}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {stale && (
            <SelectItem value={value} hint={optionHint?.(value)}>
              {t("inspector.customOption", { value })}
            </SelectItem>
          )}
          {options.map((option) => (
            <SelectItem key={option} value={option} hint={optionHint?.(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      value={value ?? ""}
      onChange={(event) => {
        const next = event.target.value;
        onChange(next === "" ? null : next);
      }}
      placeholder={placeholder}
      aria-label={label}
      className="h-8 text-right font-mono text-xs"
    />
  );
}

function SeedInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (seed: number | null) => void;
}) {
  const t = useT();
  return (
    <div className="flex w-full items-center gap-1">
      <Input
        value={value === null ? "" : String(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onChange(digits === "" ? null : Number.parseInt(digits, 10));
        }}
        placeholder={t("inspector.seedRandom")}
        inputMode="numeric"
        aria-label={t("inspector.seed")}
        className="h-8 text-right font-mono text-xs"
      />
      {value !== null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("inspector.seedClearAria")}
              onClick={() => {
                onChange(null);
              }}
            >
              <X className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("inspector.seedBackToRandom")}</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("inspector.seedRollAria")}
            onClick={() => {
              onChange(Math.floor(Math.random() * 2_147_483_647));
            }}
          >
            <Dice5 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("inspector.seedRoll")}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function CapabilityChips({ model }: { model: VideoModel }) {
  const t = useT();
  const caps: { labelKey: MessageKey; supported: boolean }[] = [
    { labelKey: "chips.textToVideo", supported: modelSupports(model, "text-to-video") === true },
    { labelKey: "chips.imageToVideo", supported: modelSupports(model, "image-to-video") === true },
    { labelKey: "chips.startEnd", supported: modelSupports(model, "end-image") === true },
    {
      labelKey: "chips.negativePrompt",
      supported: modelSupports(model, "negative-prompt") === true,
    },
    { labelKey: "chips.audio", supported: modelSupports(model, "audio") === true },
    { labelKey: "chips.seed", supported: modelSupports(model, "seed") === true },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {caps.map((cap) => (
        <Badge
          key={cap.labelKey}
          variant="outline"
          className={cn(!cap.supported && "opacity-35")}
          aria-disabled={!cap.supported}
        >
          {t(cap.labelKey)}
        </Badge>
      ))}
    </div>
  );
}

function CostValue({ estimate }: { estimate: CostEstimate }) {
  const t = useT();
  if (estimate.kind === "estimated") {
    return <ReadonlyValue>${estimate.money.amount.toFixed(3)}</ReadonlyValue>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default text-right font-mono text-xs text-muted-foreground/70 underline decoration-dotted underline-offset-2">
          {t("inspector.unknown")}
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-56">
        {estimateReasonText(t, estimate.reason)}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Per-option price hints for one selector dimension. Only offered when at
 * least two options resolve to different published rates — a flat-priced
 * model gets no noise, a tiered one explains itself right where the choice
 * is made.
 */
function priceHintFor(
  t: Translate,
  input: EstimationInput | null,
  options: string[] | null,
  dimension: "resolution" | "aspectRatio",
): ((option: string) => string | null) | undefined {
  if (input === null || options === null || options.length < 2) return undefined;
  const rateOf = (option: string): number | null =>
    perSecondRate({ ...input, [dimension]: option });
  const distinct = new Set(options.map(rateOf).filter((rate): rate is number => rate !== null));
  if (distinct.size < 2) return undefined;
  return (option) => {
    const rate = rateOf(option);
    return rate === null ? null : t("price.perSecond", { amount: formatUsd(rate) });
  };
}

/* ------------------------------------------------------------------ */
/* Version snapshot view                                               */
/* ------------------------------------------------------------------ */

function VersionInspector({
  version,
  catalog,
  onBackToDraft,
}: {
  version: GenerationVersion;
  catalog: VideoModel[];
  onBackToDraft: () => void;
}) {
  const t = useT();
  const failureText = useFailureText();
  const model = catalog.find((m) => m.id === version.settings.modelId) ?? null;
  const task = useVersionTask(version.id);
  const job = useGenerationJob(version.jobId);
  const result = useGenerationResult(version.id);

  // Live phase wins; else the persisted job; else "not generated".
  const status =
    task !== null
      ? { label: t(phaseLabelKey[task.phase]), variant: phaseBadgeVariant[task.phase] }
      : job.data != null
        ? jobStatusBadge(job.data.status, t)
        : { label: t("inspector.notGenerated"), variant: "secondary" as const };
  const failure = task?.failure ?? job.data?.failure ?? null;
  const actual = task?.actualCost ?? job.data?.cost.actual ?? null;

  return (
    <div className="flex h-full flex-col bg-sidebar/40">
      <PanelHeader className="justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="font-mono text-xs font-medium">
            {t("take.number", { number: version.number })}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onBackToDraft}>
          {t("inspector.backToDraft")}
        </Button>
      </PanelHeader>

      <InspectorBody>
        <InspectorGroup title={t("inspector.promptGroup")}>
          <p className="line-clamp-4 text-xs leading-5 text-muted-foreground">
            {version.prompt.text === "" ? t("inspector.noPrompt") : version.prompt.text}
          </p>
          {version.prompt.negativeText !== null && version.prompt.negativeText !== "" && (
            <p className="line-clamp-2 text-2xs leading-4 text-muted-foreground/60">
              {t("composer.negative")} · {version.prompt.negativeText}
            </p>
          )}
        </InspectorGroup>

        <InspectorGroup title={t("inspector.settingsGroup")}>
          <InspectorRow label={t("inspector.model")}>
            <ReadonlyValue>{model?.name ?? version.settings.modelId}</ReadonlyValue>
          </InspectorRow>
          <InspectorRow label={t("inspector.resolution")}>
            <ReadonlyValue>{version.settings.resolution ?? "—"}</ReadonlyValue>
          </InspectorRow>
          <InspectorRow label={t("inspector.aspectRatio")}>
            <ReadonlyValue>{version.settings.aspectRatio ?? "—"}</ReadonlyValue>
          </InspectorRow>
          <InspectorRow label={t("inspector.duration")}>
            <ReadonlyValue>
              {version.settings.durationSeconds === null
                ? "—"
                : formatSecondsHint(version.settings.durationSeconds)}
            </ReadonlyValue>
          </InspectorRow>
          <InspectorRow label={t("inspector.seed")}>
            <ReadonlyValue>{version.settings.seed ?? t("inspector.seedRandom")}</ReadonlyValue>
          </InspectorRow>
          <InspectorRow label={t("inspector.audio")}>
            <ReadonlyValue>
              {version.settings.generateAudio === null
                ? "—"
                : version.settings.generateAudio
                  ? t("common.on")
                  : t("common.off")}
            </ReadonlyValue>
          </InspectorRow>
        </InspectorGroup>

        <InspectorGroup title={t("inspector.output")}>
          <InspectorRow label={t("inspector.status")}>
            <Badge variant={status.variant}>{status.label}</Badge>
          </InspectorRow>
          {failure !== null && (
            <p className="text-2xs leading-relaxed text-destructive">{failureText(failure)}</p>
          )}
          <InspectorRow label={t("inspector.actualCost")}>
            <ReadonlyValue>
              {actual === null ? "—" : `$${actual.money.amount.toFixed(4)}`}
            </ReadonlyValue>
          </InspectorRow>
          {result.data?.fileSizeBytes != null && (
            <InspectorRow label={t("inspector.fileSize")}>
              <ReadonlyValue>{formatBytes(result.data.fileSizeBytes)}</ReadonlyValue>
            </InspectorRow>
          )}
        </InspectorGroup>

        <p className="px-4 py-3 text-2xs leading-relaxed text-muted-foreground/60">
          {t("inspector.immutableNote")}
        </p>
      </InspectorBody>
    </div>
  );
}

function jobStatusBadge(
  status: string,
  t: Translate,
): {
  label: string;
  variant: React.ComponentProps<typeof Badge>["variant"];
} {
  switch (status) {
    case "queued":
      return { label: t("phase.queued"), variant: "secondary" };
    case "running":
      return { label: t("phase.generating"), variant: "warning" };
    case "succeeded":
      return { label: t("phase.completed"), variant: "success" };
    case "failed":
      return { label: t("phase.failed"), variant: "destructive" };
    case "canceled":
      return { label: t("phase.canceled"), variant: "secondary" };
    default:
      return { label: status, variant: "secondary" };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/* Inspector                                                           */
/* ------------------------------------------------------------------ */

interface InspectorProps {
  draft: Scene;
  patch: (partial: ScenePatch) => void;
  target: InspectorTarget;
  onBackToDraft: () => void;
  control: GenerateControl;
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
}

/**
 * The right-hand Inspector: capability-driven controls for the selected
 * scene. Sections render from the capability registry — a control the
 * selected model cannot deliver simply is not there, and upcoming features
 * appear as locked rows. When a take is selected in the history panel the
 * Inspector flips into its read-only view.
 */
function Inspector({
  draft,
  patch,
  target,
  onBackToDraft,
  control,
  mode,
  onModeChange,
}: InspectorProps) {
  const t = useT();
  const failureText = useFailureText();
  const models = useVideoModels();
  const catalog = models.data ?? [];

  if (target.kind === "version") {
    return (
      <VersionInspector version={target.version} catalog={catalog} onBackToDraft={onBackToDraft} />
    );
  }

  const generation = draft.generation;
  const model = catalog.find((m) => m.id === generation.modelId) ?? null;
  const estimationInput = model ? draftEstimationInput(draft, model, mode) : null;
  const estimate = estimationInput
    ? pricingStrategy.estimate(estimationInput)
    : unknownCost({ kind: "no-model" });
  // The exact $/s the current selection resolves to — the honest counterpart
  // of the catalog's "from …" teaser.
  const rate = estimationInput ? perSecondRate(estimationInput) : null;
  const resolutionHint = priceHintFor(
    t,
    estimationInput,
    model?.capabilities.resolutions ?? null,
    "resolution",
  );
  const aspectRatioHint = priceHintFor(
    t,
    estimationInput,
    model?.capabilities.aspectRatios ?? null,
    "aspectRatio",
  );
  const providerName = model ? getProvider(model.providerId).info.name : null;
  const price = model ? priceLabelText(t, modelPriceLabel(model)) : null;

  const task = control.task;
  const capabilities = control.capabilities;
  const seedSupported = capabilities.seed.enabled;
  const audioSupported = capabilities.audio.enabled;

  return (
    <div className="flex h-full flex-col bg-sidebar/40">
      <PanelHeader className="justify-between gap-2">
        <SectionLabel>{t("inspector.title")}</SectionLabel>
        <Badge variant="secondary">{t("inspector.draft")}</Badge>
      </PanelHeader>

      <InspectorBody>
        <InspectorGroup title={t("mode.title")}>
          <ModeSelector value={mode} profile={capabilities} onChange={onModeChange} />
        </InspectorGroup>

        <InspectorGroup title={t("inspector.model")}>
          <ModelPicker
            value={generation.modelId}
            onChange={(modelId) => {
              patch({ generation: { ...generation, modelId } });
            }}
          />
          {model && (
            <>
              <CapabilityChips model={model} />
              <p className="text-2xs text-muted-foreground/60">
                {price === null
                  ? t("inspector.priceUnavailable")
                  : t("inspector.catalogPrice", { price })}
              </p>
            </>
          )}
        </InspectorGroup>

        <InspectorGroup title={t("inspector.video")}>
          <InspectorRow label={t("inspector.resolution")}>
            <SelectOrInput
              label={t("inspector.resolution")}
              value={generation.resolution}
              options={model?.capabilities.resolutions ?? null}
              placeholder="1080p"
              onChange={(resolution) => {
                patch({ generation: { ...generation, resolution } });
              }}
              optionHint={resolutionHint}
            />
          </InspectorRow>
          <InspectorRow label={t("inspector.aspectRatio")}>
            <SelectOrInput
              label={t("inspector.aspectRatio")}
              value={generation.aspectRatio}
              options={model?.capabilities.aspectRatios ?? null}
              placeholder="16:9"
              onChange={(aspectRatio) => {
                patch({ generation: { ...generation, aspectRatio } });
              }}
              optionHint={aspectRatioHint}
            />
          </InspectorRow>
          <InspectorRow label={t("inspector.duration")} stacked>
            <DurationInput
              value={generation.durationSeconds}
              onChange={(durationSeconds) => {
                patch({ generation: { ...generation, durationSeconds } });
              }}
              supportedSeconds={model?.capabilities.durationsSeconds ?? null}
            />
          </InspectorRow>
        </InspectorGroup>

        {/* Controls the model cannot deliver are absent, not disabled —
            the group disappears entirely when nothing in it applies. */}
        {(seedSupported || audioSupported) && (
          <InspectorGroup title={t("inspector.generation")}>
            {seedSupported && (
              <InspectorRow label={t("inspector.seed")}>
                <SeedInput
                  value={generation.seed}
                  onChange={(seed) => {
                    patch({ generation: { ...generation, seed } });
                  }}
                />
              </InspectorRow>
            )}
            {audioSupported && (
              <InspectorRow label={t("inspector.audio")}>
                <Switch
                  checked={generation.generateAudio}
                  onCheckedChange={(generateAudio) => {
                    patch({ generation: { ...generation, generateAudio } });
                  }}
                  aria-label={t("inspector.audioAria")}
                />
              </InspectorRow>
            )}
          </InspectorGroup>
        )}

        <InspectorGroup title={t("inspector.creativeControls")}>
          <LockedFeatures profile={capabilities} />
        </InspectorGroup>

        <InspectorGroup title={t("inspector.output")}>
          {rate !== null && (
            <InspectorRow label={t("inspector.rate")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default truncate text-right font-mono text-xs text-foreground">
                    {t("price.perSecond", { amount: formatUsd(rate) })}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-56">
                  {t("inspector.rateHint")}
                </TooltipContent>
              </Tooltip>
            </InspectorRow>
          )}
          <InspectorRow label={t("inspector.estCost")}>
            <CostValue estimate={estimate} />
          </InspectorRow>
          <InspectorRow label={t("inspector.actualCost")}>
            {task?.actualCost != null ? (
              <ReadonlyValue>${task.actualCost.money.amount.toFixed(4)}</ReadonlyValue>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default font-mono text-xs text-muted-foreground/50">
                    —
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left">{t("inspector.actualCostHint")}</TooltipContent>
              </Tooltip>
            )}
          </InspectorRow>
          <InspectorRow label={t("inspector.provider")}>
            <ReadonlyValue>{providerName ?? "—"}</ReadonlyValue>
          </InspectorRow>
          <InspectorRow label={t("inspector.status")}>
            {task !== null ? (
              <Badge variant={phaseBadgeVariant[task.phase]}>
                {t(phaseLabelKey[task.phase])}
                {task.versionNumber > 0 && ` · ${t("take.number", { number: task.versionNumber })}`}
              </Badge>
            ) : (
              <Badge variant="secondary">{t("inspector.ready")}</Badge>
            )}
          </InspectorRow>
          {task?.failure != null && (
            <p className="text-2xs leading-relaxed text-destructive">{failureText(task.failure)}</p>
          )}
          {generation.durationSeconds !== null && (
            <p className="text-right font-mono text-2xs text-muted-foreground/50">
              {t("inspector.planned", { seconds: trimNumber(generation.durationSeconds) })}
            </p>
          )}
        </InspectorGroup>
      </InspectorBody>
    </div>
  );
}

export { Inspector };
