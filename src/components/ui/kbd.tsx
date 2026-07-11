import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Keyboard shortcut chip — the one visual voice for shortcuts everywhere
 * (empty states, tooltips, menus). Purely presentational.
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-sm border bg-surface-3 px-1.5 font-mono text-2xs font-medium text-muted-foreground select-none",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
