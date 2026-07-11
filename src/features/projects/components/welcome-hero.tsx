import { motion } from "framer-motion";
import { ChevronRight, PenLine, Plus, Shapes, Sparkles, type LucideIcon } from "lucide-react";

import { Logo } from "@/components/shared";
import { Button, Kbd } from "@/components/ui";
import { appConfig } from "@/core/config";
import { useT, type MessageKey } from "@/i18n";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { formatShortcut } from "@/lib/shortcuts";

interface WelcomeHeroProps {
  onCreate: () => void;
  creating: boolean;
}

const steps: { icon: LucideIcon; labelKey: MessageKey }[] = [
  { icon: PenLine, labelKey: "welcome.stepWrite" },
  { icon: Shapes, labelKey: "welcome.stepModel" },
  { icon: Sparkles, labelKey: "welcome.stepGenerate" },
];

/**
 * The first-launch welcome: shown instead of the projects grid while the
 * studio is empty. One headline, one promise, one action — the entire
 * workflow is previewed as three quiet steps, not explained in paragraphs.
 */
function WelcomeHero({ onCreate, creating }: WelcomeHeroProps) {
  const t = useT();
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-8">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex max-w-md flex-col items-center gap-8 pb-10 text-center"
      >
        <motion.div
          variants={staggerItem}
          className="relative flex size-16 items-center justify-center rounded-2xl border bg-surface-2 shadow-raised"
        >
          <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-primary/15 blur-xl" />
          <Logo className="relative size-8 text-foreground" />
        </motion.div>

        <motion.div variants={staggerItem} className="flex flex-col items-center gap-2.5">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            {t("welcome.title")}{" "}
            <span className="bg-[image:var(--gradient-brand)] bg-clip-text text-transparent">
              {appConfig.name}
            </span>
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-balance text-muted-foreground">
            {t("welcome.subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={staggerItem}
          aria-label={t("welcome.howItWorks")}
          className="flex items-center gap-2 select-none"
        >
          {steps.map((step, index) => (
            <div key={step.labelKey} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight aria-hidden="true" className="size-3.5 text-muted-foreground/40" />
              )}
              <div className="flex items-center gap-2 rounded-full border bg-surface-1 py-1.5 pr-3.5 pl-2 shadow-raised">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/12">
                  <step.icon className="size-3 text-primary" />
                </span>
                <span className="text-xs text-muted-foreground">{t(step.labelKey)}</span>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div variants={staggerItem} className="flex flex-col items-center gap-3">
          <Button size="lg" onClick={onCreate} loading={creating} className="px-7">
            <Plus />
            {t("welcome.cta")}
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Kbd>{formatShortcut("new-project")}</Kbd>
            {t("welcome.hint")}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export { WelcomeHero };
