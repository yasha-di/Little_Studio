import * as React from "react";

import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { type ConnectionState } from "@/services/providers";

import { connectionStatusMeta } from "./connection-status-meta";

/** Colored indicator dot for a provider connection state. */
export function ConnectionStatusDot({
  state,
  className,
  ...props
}: React.ComponentProps<"span"> & { state: ConnectionState }) {
  const t = useT();
  const meta = connectionStatusMeta(state, t);
  return (
    <span
      aria-hidden="true"
      className={cn("size-1.5 shrink-0 rounded-full", meta.dotClass, className)}
      {...props}
    />
  );
}
