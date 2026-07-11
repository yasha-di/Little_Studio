import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The one uppercase caption style for section and panel titles — inspector
 * groups, editor sections and panel headers all draw from here so the
 * hierarchy reads identically everywhere.
 */
function SectionLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="section-label"
      className={cn(
        "text-2xs font-medium tracking-wider text-muted-foreground/80 uppercase select-none",
        className,
      )}
      {...props}
    />
  );
}

/** The standard header bar of a workspace panel (scene rail, versions…). */
function PanelHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-header"
      className={cn("app-chrome flex h-9 shrink-0 items-center gap-2 border-b px-3", className)}
      {...props}
    />
  );
}

export { PanelHeader, SectionLabel };
