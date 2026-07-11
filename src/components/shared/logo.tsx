import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Little Studio wordmark: a minimal clapperboard glyph.
 * Inline SVG so it inherits `currentColor` and ships zero assets.
 */
function Logo({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("size-5", className)}
      {...props}
    >
      <rect x="3" y="8.5" width="18" height="12" rx="2.5" fill="currentColor" opacity="0.9" />
      <path
        d="M4.2 4.6a2.5 2.5 0 0 1 3.06-1.77l12.56 3.37a1 1 0 0 1 .7 1.22l-.51 1.93L3.94 6.53l.26-1.93Z"
        fill="currentColor"
        opacity="0.55"
      />
      <circle cx="8" cy="14.5" r="1.4" fill="var(--background)" />
      <path d="M12 12.6v3.8l3.2-1.9L12 12.6Z" fill="var(--background)" />
    </svg>
  );
}

export { Logo };
