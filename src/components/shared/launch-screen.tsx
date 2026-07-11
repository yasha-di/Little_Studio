import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

import { appConfig } from "@/core/config";
import { useT } from "@/i18n";
import { easings } from "@/lib/motion";

import { Logo } from "./logo";

/** How long the brand mark holds before the shell is revealed. */
const HOLD_MS = 900;

/**
 * The launch screen: a quiet, full-window brand moment while the shell
 * boots. Purely presentational — the app renders and initializes underneath
 * from the first frame; this overlay simply lifts once the hold elapses.
 */
function LaunchScreen() {
  const t = useT();
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, HOLD_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: easings.inOut }}
          className="app-chrome fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: easings.out }}
            className="flex flex-col items-center gap-5"
          >
            <div className="relative flex size-16 items-center justify-center rounded-2xl border bg-surface-2 shadow-raised">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl bg-primary/15 blur-xl"
              />
              <Logo className="relative size-8 text-foreground" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="bg-[image:var(--gradient-brand)] bg-clip-text text-xl font-semibold tracking-tight text-transparent">
                {appConfig.name}
              </span>
              <span className="text-sm text-muted-foreground">{t("app.tagline")}</span>
            </div>
          </motion.div>
          <span className="absolute bottom-6 font-mono text-2xs text-muted-foreground/50">
            v{appConfig.version}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { LaunchScreen };
