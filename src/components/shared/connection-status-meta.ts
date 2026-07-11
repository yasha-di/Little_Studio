import { type Translate } from "@/i18n";
import { type ConnectionState } from "@/services/providers";

/**
 * Shared visual vocabulary for provider connection states: one mapping,
 * used by the top bar and settings alike, so a state always looks the
 * same everywhere. Copy comes from the active language via `t`.
 */
export interface ConnectionStatusMeta {
  label: string;
  /** Tailwind class for the indicator dot. */
  dotClass: string;
  description: string;
}

export function connectionStatusMeta(state: ConnectionState, t: Translate): ConnectionStatusMeta {
  switch (state.status) {
    case "connected":
      return {
        label: t("connection.connected.label"),
        dotClass: "bg-success",
        description: t("connection.connected.description"),
      };
    case "connecting":
      return {
        label: t("connection.connecting.label"),
        dotClass: "bg-warning animate-pulse",
        description: t("connection.connecting.description"),
      };
    case "invalid-key":
      return {
        label: t("connection.invalidKey.label"),
        dotClass: "bg-destructive",
        description: t("connection.invalidKey.description"),
      };
    case "rate-limited":
      return {
        label: t("connection.rateLimited.label"),
        dotClass: "bg-warning",
        description:
          state.retryAfterSeconds === null
            ? t("connection.rateLimited.description")
            : t("connection.rateLimited.retryIn", { seconds: state.retryAfterSeconds }),
      };
    case "offline":
      return {
        label: t("connection.offline.label"),
        dotClass: "bg-muted-foreground/50",
        description: t("connection.offline.description"),
      };
    case "error":
      return {
        label: t("connection.error.label"),
        dotClass: "bg-destructive",
        description: state.message,
      };
    case "disconnected":
      return {
        label: t("connection.disconnected.label"),
        dotClass: "bg-muted-foreground/40",
        description: t("connection.disconnected.description"),
      };
  }
}
