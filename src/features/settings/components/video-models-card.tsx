import { Clapperboard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { priceLabelText } from "@/hooks";
import { useOpenRouterConnection, useVideoModels } from "@/hooks/use-openrouter";
import { useT, type MessageKey, type Translate } from "@/i18n";
import { modelSupports } from "@/services/capabilities";
import { modelPriceLabel } from "@/services/pricing";
import { type VideoModel } from "@/services/providers";

function capabilityBadges(model: VideoModel): MessageKey[] {
  const badges: MessageKey[] = [];
  if (modelSupports(model, "text-to-video") === true) badges.push("chips.textToVideo");
  if (modelSupports(model, "image-to-video") === true) badges.push("chips.imageToVideo");
  if (modelSupports(model, "end-image") === true) badges.push("chips.startEnd");
  if (modelSupports(model, "negative-prompt") === true) badges.push("chips.negativePrompt");
  if (modelSupports(model, "audio") === true) badges.push("chips.audio");
  if (modelSupports(model, "seed") === true) badges.push("chips.seed");
  return badges;
}

function ModelRow({ model, t }: { model: VideoModel; t: Translate }) {
  const price = priceLabelText(t, modelPriceLabel(model));
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-surface-1 px-3 py-2.5">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm font-medium">{model.name}</span>
        <span className="truncate font-mono text-xs text-muted-foreground">{model.id}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {capabilityBadges(model).map((labelKey) => (
          <Badge key={labelKey} variant="secondary">
            {t(labelKey)}
          </Badge>
        ))}
        <span className="ml-1 font-mono text-xs text-muted-foreground">
          {price ?? t("model.priceUnavailable")}
        </span>
      </div>
    </div>
  );
}

export function VideoModelsCard() {
  const t = useT();
  const connection = useOpenRouterConnection();
  const models = useVideoModels();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.models.title")}</CardTitle>
        <CardDescription>{t("settings.models.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {connection.status !== "connected" ? (
          <p className="text-sm text-muted-foreground">{t("settings.models.connectFirst")}</p>
        ) : models.isPending ? (
          <>
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </>
        ) : models.isError ? (
          <p className="text-sm text-destructive">
            {t("settings.models.loadError", { message: models.error.message })}
          </p>
        ) : models.data.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
            <Clapperboard className="size-4 shrink-0" />
            {t("settings.models.empty")}
          </div>
        ) : (
          models.data.map((model) => <ModelRow key={model.id} model={model} t={t} />)
        )}
      </CardContent>
    </Card>
  );
}
