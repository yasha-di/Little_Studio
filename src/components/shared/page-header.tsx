import * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.ComponentProps<"header"> {
  title: string;
  description?: string;
  /** Right-aligned action area (buttons, filters). */
  actions?: React.ReactNode;
}

function PageHeader({ title, description, actions, className, ...props }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn("app-chrome flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description !== undefined && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions !== undefined && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export { PageHeader };
