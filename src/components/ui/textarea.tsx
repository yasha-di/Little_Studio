import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-input/25 px-3 py-2 text-sm transition-colors outline-none selection:bg-primary/30 placeholder:text-muted-foreground/70 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/30",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
