import { Check, Copy } from "lucide-react";
import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { appConfig } from "@/core/config";
import { useT } from "@/i18n";
import { copyText } from "@/lib/utils";

import { Logo } from "./logo";

/**
 * The About dialog: the product's identity card. Opened from the version
 * label in the sidebar footer (and the command registry, once the palette
 * lands). Clicking the version chip copies it for bug reports.
 */
function AboutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const [copied, setCopied] = React.useState(false);

  const handleCopyVersion = () => {
    void copyText(`${appConfig.name} ${appConfig.version}`).then((ok) => {
      if (!ok) return;
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <div className="flex flex-col items-center gap-4 pt-2 text-center">
          <div className="relative flex size-14 items-center justify-center rounded-2xl border bg-surface-2 shadow-raised">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-primary/15 blur-lg"
            />
            <Logo className="relative size-7 text-foreground" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <DialogTitle className="text-lg tracking-tight">{appConfig.name}</DialogTitle>
            <DialogDescription>{t("app.tagline")}</DialogDescription>
          </div>
          <button
            type="button"
            onClick={handleCopyVersion}
            className="flex h-6 items-center gap-1.5 rounded-full border bg-surface-2 px-2.5 font-mono text-2xs text-muted-foreground transition-colors duration-150 outline-none hover:bg-surface-4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {t("about.version", { version: appConfig.version })}
            {copied ? (
              <Check className="size-3 text-success" />
            ) : (
              <Copy className="size-3 opacity-60" />
            )}
          </button>
          <div className="flex w-full flex-col gap-2 border-t pt-3 text-2xs leading-relaxed text-muted-foreground/60">
            <span>{t("about.footer")}</span>
            <span>{t("about.copyright", { year: new Date().getFullYear() })}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AboutDialog };
