import { Badge } from "@/components/ui";
import { useI18n, type MessageKey } from "@/i18n";
import { buildVersionTree, type VersionNode } from "@/lib/version-tree";
import { cn } from "@/lib/utils";
import { type GenerationVersion, type GenerationVersionId, type VersionOperation } from "@/types";

/** Each kind of take keeps its own subtle hue so a glance at the tree
 * tells the story in film language: a Remix changed the prompt or settings,
 * a Retake rolled the same shot again. */
const operationBadge: Record<
  Exclude<VersionOperation, "initial">,
  { labelKey: MessageKey; className: string }
> = {
  remix: { labelKey: "takes.operation.remix", className: "border-primary/30 text-primary" },
  extend: { labelKey: "takes.operation.extend", className: "border-success/30 text-success" },
  regenerate: {
    labelKey: "takes.operation.retake",
    className: "border-border text-muted-foreground",
  },
};

function NodeChip({
  version,
  selected,
  onSelect,
}: {
  version: GenerationVersion;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex h-7 w-fit max-w-64 items-center gap-1.5 rounded-md border px-2 transition-[color,background-color,border-color,box-shadow,transform] duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.985]",
        selected
          ? "border-primary/60 bg-primary/15 text-foreground shadow-glow-primary"
          : "border-border bg-surface-1 hover:border-border-strong hover:bg-surface-3",
      )}
    >
      <span className="font-mono text-xs font-medium">
        {t("take.number", { number: version.number })}
      </span>
      {version.operation !== "initial" && (
        <Badge
          variant="outline"
          className={cn("px-1.5 py-0 text-3xs", operationBadge[version.operation].className)}
        >
          {t(operationBadge[version.operation].labelKey)}
        </Badge>
      )}
      {version.label !== null && (
        <span className="truncate text-xs text-muted-foreground">{version.label}</span>
      )}
    </button>
  );
}

function Branch({
  node,
  selectedId,
  onSelect,
}: {
  node: VersionNode;
  selectedId: GenerationVersionId | null;
  onSelect: (version: GenerationVersion) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <NodeChip
        version={node.version}
        selected={node.version.id === selectedId}
        onSelect={() => {
          onSelect(node.version);
        }}
      />
      {node.children.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {node.children.map((child, index) => {
            const isLast = index === node.children.length - 1;
            return (
              <div key={child.version.id} className="relative pl-6">
                {/* rounded elbow from the parent's spine into this child */}
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-2 h-[15px] w-3.5 rounded-bl-md border-b border-l border-border"
                />
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-2 h-full w-px bg-border"
                  />
                )}
                <Branch node={child} selectedId={selectedId} onSelect={onSelect} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface VersionTreeProps {
  versions: GenerationVersion[];
  selectedId: GenerationVersionId | null;
  onSelect: (version: GenerationVersion) => void;
}

/**
 * The version tree visualization — versions branch like git commits, and
 * the branch structure (remix vs extend vs regenerate) is the visual story.
 * Derivation lives in `lib/version-tree`; this component only draws.
 */
function VersionTree({ versions, selectedId, onSelect }: VersionTreeProps) {
  const { tCount } = useI18n();
  const tree = buildVersionTree(versions);
  if (tree.root === null) return null;

  return (
    <div className="flex min-w-fit flex-col">
      <Branch node={tree.root} selectedId={selectedId} onSelect={onSelect} />
      {tree.orphans.length > 0 && (
        <p className="mt-2 text-2xs text-warning">{tCount("takes.hidden", tree.orphans.length)}</p>
      )}
    </div>
  );
}

export { VersionTree };
