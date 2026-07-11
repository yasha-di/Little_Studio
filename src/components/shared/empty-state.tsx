import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import * as React from "react";

import { Kbd } from "@/components/ui/kbd";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.ComponentProps<"div"> {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional call-to-action area. */
  action?: React.ReactNode;
  /** Optional keyboard hint, e.g. { keys: "Ctrl+N", label: "creates a project" }. */
  hint?: { keys: string; label: string };
}

/**
 * The one empty-state voice of the app: a softly-lit icon tile (the same
 * visual language as the launch screen and About dialog), a short title,
 * an explanation and a clear next action.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  hint,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn("flex h-full min-h-64 items-center justify-center p-6", className)}
      {...props}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.normal}
        className="flex max-w-sm flex-col items-center gap-3 text-center"
      >
        <div className="relative mb-1 flex size-12 items-center justify-center rounded-xl border bg-surface-2 shadow-raised">
          <span aria-hidden="true" className="absolute inset-0 rounded-xl bg-primary/10 blur-lg" />
          <Icon className="relative size-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">{title}</h2>
          {description !== undefined && (
            <p className="text-sm leading-relaxed text-balance text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action !== undefined && <div className="mt-1">{action}</div>}
        {hint !== undefined && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Kbd>{hint.keys}</Kbd>
            {hint.label}
          </p>
        )}
      </motion.div>
    </div>
  );
}

export { EmptyState };
