import * as React from "react";

import { SectionLabel } from "@/components/shared";
import { cn } from "@/lib/utils";

interface EditorSectionProps extends React.ComponentProps<"section"> {
  title: string;
  /** Right-aligned area next to the title (counters, toggles). */
  meta?: React.ReactNode;
}

/**
 * A labelled block inside the scene editor. Deliberately quiet: a small
 * uppercase caption, no card chrome — the editor should read as one
 * continuous writing surface, not a stack of boxes.
 */
function EditorSection({ title, meta, className, children, ...props }: EditorSectionProps) {
  return (
    <section data-slot="editor-section" className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex h-5 items-center justify-between gap-2">
        <h3>
          <SectionLabel>{title}</SectionLabel>
        </h3>
        {meta !== undefined && <div className="flex items-center gap-2">{meta}</div>}
      </div>
      {children}
    </section>
  );
}

export { EditorSection };
