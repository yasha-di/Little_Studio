import { X } from "lucide-react";
import * as React from "react";

import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

/**
 * Inline tag editing, keyboard-first: type and press Enter (or comma) to
 * add, Backspace in the empty field to pop the last tag. No dialogs, no
 * pickers — tagging must not interrupt writing flow.
 */
function TagInput({ tags, onChange, className }: TagInputProps) {
  const t = useT();
  const [value, setValue] = React.useState("");

  const commit = () => {
    const tag = value.trim();
    setValue("");
    if (tag === "" || tags.includes(tag)) return;
    onChange([...tags, tag]);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && value === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="group flex h-6 items-center gap-1 rounded-full border border-transparent bg-secondary px-2 text-xs text-secondary-foreground"
        >
          {tag}
          <button
            type="button"
            aria-label={t("tags.remove", { tag })}
            onClick={() => {
              onChange(tags.filter((t) => t !== tag));
            }}
            className="rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? t("tags.add") : "+"}
        className="h-6 min-w-16 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

export { TagInput };
