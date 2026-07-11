import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, KeyRound, RefreshCw, Unplug } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { connectionStatusMeta, ConnectionStatusDot } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/loading";
import {
  useConnectOpenRouter,
  useDisconnectOpenRouter,
  useMaskedApiKey,
  useOpenRouterConnection,
  useRefreshOpenRouter,
} from "@/hooks/use-openrouter";
import { useT } from "@/i18n";
import { type Money } from "@/types/money";

// Message key resolved at render time — react-hook-form stores it as-is.
const apiKeyFormSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(20, "settings.provider.invalidKey")
    .max(500, "settings.provider.invalidKey"),
});

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

function formatMoney(money: Money | null): string {
  if (money === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: 2,
  }).format(money.amount);
}

function ConnectForm() {
  const t = useT();
  const connection = useOpenRouterConnection();
  const connect = useConnectOpenRouter();
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: { apiKey: "" },
  });

  const meta = connectionStatusMeta(connection, t);
  const showStateError = ["invalid-key", "offline", "rate-limited", "error"].includes(
    connection.status,
  );
  const fieldError =
    form.formState.errors.apiKey?.message === undefined
      ? undefined
      : t("settings.provider.invalidKey");

  const onSubmit = form.handleSubmit(async (values) => {
    // Errors surface through the connection state; swallow the rejection.
    await connect.mutateAsync(values.apiKey).catch(() => undefined);
    form.reset();
  });

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor="openrouter-api-key" className="text-sm font-medium">
        {t("settings.provider.apiKey")}
      </label>
      <div className="flex gap-2">
        <Input
          id="openrouter-api-key"
          type="password"
          placeholder="sk-or-…"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={fieldError !== undefined}
          {...form.register("apiKey")}
        />
        <Button type="submit" disabled={connect.isPending}>
          {connect.isPending ? <Spinner className="text-primary-foreground" /> : <KeyRound />}
          {t("settings.provider.connect")}
        </Button>
      </div>
      {fieldError !== undefined && <p className="text-xs text-destructive">{fieldError}</p>}
      {showStateError && <p className="text-xs text-destructive">{meta.description}</p>}
      <p className="text-xs text-muted-foreground">{t("settings.provider.keyNote")}</p>
    </form>
  );
}

function ConnectedPanel() {
  const t = useT();
  const connection = useOpenRouterConnection();
  const maskedKey = useMaskedApiKey(connection.status === "connected");
  const refresh = useRefreshOpenRouter();
  const disconnect = useDisconnectOpenRouter();

  if (connection.status !== "connected") return null;
  const { account } = connection;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{t("settings.provider.apiKey")}</dt>
          <dd className="font-mono text-xs">{maskedKey.data ?? "…"}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{t("settings.provider.label")}</dt>
          <dd className="truncate">{account.keyLabel ?? "—"}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{t("settings.provider.balance")}</dt>
          <dd className="font-mono">{formatMoney(account.balance)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{t("settings.provider.usage")}</dt>
          <dd className="font-mono">{formatMoney(account.usage)}</dd>
        </div>
      </dl>
      <div className="flex items-center gap-2">
        {account.isFreeTier === true && (
          <Badge variant="warning">{t("settings.provider.freeTier")}</Badge>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={refresh.isPending}
            onClick={() => {
              refresh.mutate();
            }}
          >
            <RefreshCw className={refresh.isPending ? "animate-spin" : undefined} />
            {t("settings.provider.refresh")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={disconnect.isPending}
            onClick={() => {
              disconnect.mutate();
            }}
          >
            <Unplug />
            {t("settings.provider.disconnect")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProviderConnectionCard() {
  const t = useT();
  const connection = useOpenRouterConnection();
  const meta = connectionStatusMeta(connection, t);

  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2">
            OpenRouter
            <Badge variant="outline" className="gap-1.5">
              <ConnectionStatusDot state={connection} />
              {meta.label}
            </Badge>
          </CardTitle>
          <CardDescription>
            {t("settings.provider.backend")}{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-foreground/80 underline underline-offset-2 hover:text-foreground"
            >
              {t("settings.provider.manageKeys")} <ExternalLink className="size-3" />
            </a>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {connection.status === "connected" ? <ConnectedPanel /> : <ConnectForm />}
      </CardContent>
    </Card>
  );
}
