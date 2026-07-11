import { motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronsUpDown, SearchX, Search as SearchIcon } from "lucide-react";
import * as React from "react";
import { NavLink } from "react-router";

import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
} from "@/components/ui";
import { priceLabelText } from "@/hooks";
import { useOpenRouterConnection, useVideoModels } from "@/hooks/use-openrouter";
import { useT, type MessageKey, type Translate } from "@/i18n";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { modelSupports } from "@/services/capabilities";
import { modelPriceLabel } from "@/services/pricing";
import { type VideoModel } from "@/services/providers";

/**
 * Model Cards picker — replaces the dropdown model selector. A searchable
 * dialog of capability cards, built entirely from provider catalog data;
 * badges are derived (release date, naming), never hardcoded per model.
 */

interface ModelPickerProps {
  value: string | null;
  onChange: (modelId: string) => void;
}

const NEW_BADGE_DAYS = 90;

/** Derived, data-honest badges. Absence of signal → no badge. */
function modelBadges(
  model: VideoModel,
): { labelKey: MessageKey; variant: "default" | "warning" }[] {
  const badges: { labelKey: MessageKey; variant: "default" | "warning" }[] = [];
  const haystack = `${model.id} ${model.name}`;
  if (/fast|turbo|flash|lite/i.test(haystack)) {
    badges.push({ labelKey: "model.badgeFast", variant: "default" });
  }
  if (/preview|beta|alpha|experimental/i.test(haystack)) {
    badges.push({ labelKey: "model.badgeExperimental", variant: "warning" });
  }
  if (model.releasedAt !== null) {
    const ageMs = Date.now() - new Date(model.releasedAt).getTime();
    if (ageMs >= 0 && ageMs < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000) {
      badges.push({ labelKey: "model.badgeNew", variant: "default" });
    }
  }
  return badges;
}

function formatDurations(seconds: number[] | null): string | null {
  if (seconds === null || seconds.length === 0) return null;
  const min = Math.min(...seconds);
  const max = Math.max(...seconds);
  return min === max ? `${min}s` : `${min}–${max}s`;
}

function CapabilityChip({ label, supported }: { label: string; supported: boolean }) {
  return (
    <Badge variant="outline" className={cn("px-1.5 py-0 text-3xs", !supported && "opacity-35")}>
      {label}
    </Badge>
  );
}

const ModelCard = React.memo(function ModelCard({
  model,
  selected,
  onSelect,
  t,
}: {
  model: VideoModel;
  selected: boolean;
  onSelect: () => void;
  t: Translate;
}) {
  const price = priceLabelText(t, modelPriceLabel(model));
  const badges = modelBadges(model);
  const durations = formatDurations(model.capabilities.durationsSeconds);
  const resolutions = model.capabilities.resolutions;

  return (
    <motion.button
      variants={staggerItem}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3 text-left transition-[color,background-color,border-color,box-shadow] duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        selected
          ? "border-primary/60 bg-primary/10 shadow-glow-primary"
          : "border-border bg-surface-1 hover:border-border-strong hover:bg-surface-3",
      )}
    >
      <div className="flex w-full items-center gap-2">
        <span className="min-w-0 truncate text-sm font-medium">{model.name}</span>
        {badges.map((badge) => (
          <Badge key={badge.labelKey} variant={badge.variant} className="px-1.5 py-0 text-3xs">
            {t(badge.labelKey)}
          </Badge>
        ))}
        {selected && <Check aria-hidden="true" className="ml-auto size-4 shrink-0 text-primary" />}
      </div>

      <div className="flex w-full items-center justify-between gap-3">
        <span className="min-w-0 truncate font-mono text-2xs text-muted-foreground/70">
          {model.id}
        </span>
        <span className="shrink-0 font-mono text-2xs text-muted-foreground">
          {price ?? t("model.priceUnavailable")}
        </span>
      </div>

      <div className="flex w-full flex-wrap items-center gap-1">
        <CapabilityChip
          label={t("chips.textToVideo")}
          supported={modelSupports(model, "text-to-video") === true}
        />
        <CapabilityChip
          label={t("chips.imageToVideo")}
          supported={modelSupports(model, "image-to-video") === true}
        />
        <CapabilityChip
          label={t("chips.startEnd")}
          supported={modelSupports(model, "end-image") === true}
        />
        <CapabilityChip
          label={t("chips.negativePrompt")}
          supported={modelSupports(model, "negative-prompt") === true}
        />
        <CapabilityChip
          label={t("chips.audio")}
          supported={modelSupports(model, "audio") === true}
        />
        <CapabilityChip label={t("chips.seed")} supported={modelSupports(model, "seed") === true} />
      </div>

      {(resolutions !== null || durations !== null) && (
        <div className="flex w-full items-center gap-2 font-mono text-3xs text-muted-foreground/60">
          {resolutions !== null && resolutions.length > 0 && (
            <span className="min-w-0 truncate">{resolutions.join(" · ")}</span>
          )}
          {durations !== null && <span className="ml-auto shrink-0">{durations}</span>}
        </div>
      )}
    </motion.button>
  );
});

function matches(model: VideoModel, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return (
    model.name.toLowerCase().includes(q) ||
    model.id.toLowerCase().includes(q) ||
    model.description.toLowerCase().includes(q)
  );
}

function ModelPickerDialog({
  open,
  onOpenChange,
  models,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: VideoModel[];
  value: string | null;
  onChange: (modelId: string) => void;
}) {
  const t = useT();
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query);

  const filtered = React.useMemo(
    () => models.filter((model) => matches(model, deferredQuery)),
    [models, deferredQuery],
  );

  const select = (modelId: string) => {
    onChange(modelId);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-3xl gap-0 p-0">
        <DialogHeader className="border-b px-4 pt-4 pb-3">
          <DialogTitle>{t("model.chooseTitle")}</DialogTitle>
          <DialogDescription>
            {t("model.dialogDescription", { count: models.length })}
          </DialogDescription>
          <div className="relative mt-2">
            <SearchIcon
              aria-hidden="true"
              className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60"
            />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder={t("model.search")}
              aria-label={t("model.searchAria")}
              autoFocus
              className="pl-8"
            />
          </div>
        </DialogHeader>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <SearchX aria-hidden="true" className="size-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t("model.noMatch", { query: query.trim() })}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid max-h-[55vh] grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2"
          >
            {filtered.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                selected={model.id === value}
                t={t}
                onSelect={() => {
                  select(model.id);
                }}
              />
            ))}
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * The trigger + dialog pair. Every catalog state renders explicitly:
 * no provider, loading, error, empty, stale stored selection.
 */
function ModelPicker({ value, onChange }: ModelPickerProps) {
  const t = useT();
  const connection = useOpenRouterConnection();
  const models = useVideoModels();
  const [open, setOpen] = React.useState(false);

  if (connection.status !== "connected") {
    return (
      <NavLink
        to="/settings"
        className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-dashed border-input px-2.5 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {t("model.connectFirst")}
        <ArrowUpRight className="size-3.5 shrink-0" />
      </NavLink>
    );
  }

  if (models.isPending) return <Skeleton className="h-8 w-full" />;

  if (models.isError) {
    return <p className="text-xs text-destructive">{t("model.loadError")}</p>;
  }

  if (models.data.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("model.emptyCatalog")}</p>;
  }

  const selected = models.data.find((m) => m.id === value) ?? null;
  // A stored model can disappear from the catalog; say so rather than
  // silently dropping the user's choice.
  const stale = value !== null && selected === null;
  const price = selected === null ? null : priceLabelText(t, modelPriceLabel(selected));

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-label={t("model.chooseAria")}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-input/25 px-2.5 text-sm transition-colors duration-150 outline-none",
          "hover:bg-input/40 focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/30",
          // No model yet: a quiet accent border marks this as the next step.
          selected === null && !stale && "border-primary/40 hover:border-primary/60",
        )}
      >
        {selected !== null ? (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate">{selected.name}</span>
            <span className="shrink-0 font-mono text-2xs text-muted-foreground">
              {price ?? t("model.priceUnavailable")}
            </span>
          </span>
        ) : stale ? (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate">{value}</span>
            <span className="shrink-0 text-2xs text-warning">{t("model.notInCatalog")}</span>
          </span>
        ) : (
          <span className="truncate text-muted-foreground/70">{t("model.choosePlaceholder")}</span>
        )}
        <ChevronsUpDown aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      <ModelPickerDialog
        open={open}
        onOpenChange={setOpen}
        models={models.data}
        value={value}
        onChange={onChange}
      />
    </>
  );
}

export { ModelPicker };
