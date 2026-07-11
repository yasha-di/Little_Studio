import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-8 w-full min-w-0 rounded-md border border-input bg-input/25 px-3 py-1 text-sm transition-colors outline-none selection:bg-primary/30 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/30",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
