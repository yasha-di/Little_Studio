import { LoaderCircle } from "lucide-react";
import * as React from "react";

import { useMaybeI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/** Inline spinner for buttons, badges and tight spaces. */
function Spinner({ className, ...props }: React.ComponentProps<typeof LoaderCircle>) {
  const i18n = useMaybeI18n();
  return (
    <LoaderCircle
      data-slot="spinner"
      role="status"
      aria-label={i18n === null ? "Loading" : i18n.t("common.loading")}
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Block-level loading state that fills its container. */
function Loading({ label, className, ...props }: React.ComponentProps<"div"> & { label?: string }) {
  const i18n = useMaybeI18n();
  const text = label ?? `${i18n === null ? "Loading" : i18n.t("common.loading")}…`;
  return (
    <div
      data-slot="loading"
      className={cn(
        "flex h-full min-h-32 w-full flex-col items-center justify-center gap-3",
        className,
      )}
      {...props}
    >
      <Spinner className="size-5" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export { Loading, Spinner };
