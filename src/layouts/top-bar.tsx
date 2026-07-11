import { Settings } from "lucide-react";
import { NavLink } from "react-router";

import { connectionStatusMeta, ConnectionStatusDot, Logo } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { appConfig } from "@/core/config";
import { useOpenRouterConnection } from "@/hooks/use-openrouter";
import { useT } from "@/i18n";

function ProviderStatus() {
  const t = useT();
  const connection = useOpenRouterConnection();
  const meta = connectionStatusMeta(connection, t);
  // Until a provider is connected the pill is an invitation, not a status:
  // "Connect OpenRouter" names the single most important first step.
  const label = connection.status === "disconnected" ? t("topbar.connect") : t("topbar.provider");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to="/settings"
          className="flex h-6 items-center gap-2 rounded-full px-2.5 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ConnectionStatusDot state={connection} />
          {label}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="bottom">{meta.description}</TooltipContent>
    </Tooltip>
  );
}

function Balance() {
  const t = useT();
  const connection = useOpenRouterConnection();
  const balance = connection.status === "connected" ? connection.account.balance : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to="/settings"
          aria-label={t("topbar.creditsAria")}
          className="flex h-6 items-center rounded-full px-2.5 font-mono text-xs text-muted-foreground/70 transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {balance === null ? "$ —" : `$ ${balance.amount.toFixed(2)}`}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {balance === null ? t("topbar.creditsEmpty") : t("topbar.creditsTooltip")}
      </TooltipContent>
    </Tooltip>
  );
}

function TopBar() {
  const t = useT();
  return (
    <header
      data-slot="top-bar"
      className="app-chrome relative z-10 flex h-12 shrink-0 items-center justify-between border-b bg-topbar px-3 shadow-bar"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex size-6 items-center justify-center rounded-md border border-primary/25 bg-linear-to-b from-primary/20 to-primary/5 shadow-raised">
          <Logo className="size-4 text-foreground" />
        </div>
        <span className="text-sm font-semibold tracking-tight">{appConfig.name}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Provider capsule: status + credits live together as one quiet pill. */}
        <div className="flex h-7 items-center gap-0.5 rounded-full border bg-surface-1 px-0.5 shadow-raised">
          <ProviderStatus />
          <div aria-hidden="true" className="h-3.5 w-px bg-border" />
          <Balance />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" asChild>
              <NavLink to="/settings" aria-label={t("topbar.openPreferences")}>
                <Settings className="size-4" />
              </NavLink>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("topbar.preferences")}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

export { TopBar };
