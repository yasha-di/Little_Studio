import { GripVertical } from "lucide-react";
import * as React from "react";
import {
  Group as GroupPrimitive,
  Panel as PanelPrimitive,
  Separator as SeparatorPrimitive,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

/**
 * Resizable panel primitives (thin styled wrappers over
 * react-resizable-panels v4). Workspace layouts compose these instead of
 * importing the library directly, so the dependency stays swappable.
 */

function PanelGroup({ className, ...props }: React.ComponentProps<typeof GroupPrimitive>) {
  return (
    <GroupPrimitive
      data-slot="panel-group"
      className={cn("flex h-full w-full", className)}
      {...props}
    />
  );
}

function Panel({ className, ...props }: React.ComponentProps<typeof PanelPrimitive>) {
  return <PanelPrimitive data-slot="panel" className={cn("flex flex-col", className)} {...props} />;
}

function PanelSeparator({
  className,
  withHandle = false,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive> & {
  withHandle?: boolean;
}) {
  return (
    <SeparatorPrimitive
      data-slot="panel-separator"
      className={cn(
        "relative flex w-px items-center justify-center bg-border transition-colors",
        "hover:bg-primary/40 data-[resize=active]:bg-primary/60",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-5 w-3 items-center justify-center rounded-sm border bg-secondary">
          <GripVertical className="size-2.5 text-muted-foreground" />
        </div>
      )}
    </SeparatorPrimitive>
  );
}

export { Panel, PanelGroup, PanelSeparator };
