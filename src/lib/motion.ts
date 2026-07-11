import { type Transition, type Variants } from "framer-motion";

/**
 * Shared motion vocabulary.
 *
 * Every animation in Little Studio draws from these primitives so the app
 * moves as one coherent system: fast, subtle, never decorative.
 * If a duration is not listed here, it should not exist in the app.
 */
export const durations = {
  /** Micro-interactions: hover, press. */
  fast: 0.15,
  /** Standard UI transitions: page content, dialogs. */
  normal: 0.18,
  /** Larger structural shifts: panels, sidebar. */
  slow: 0.22,
} as const;

export const easings = {
  /** Default: starts fast, settles gently — feels responsive. */
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const transitions = {
  fast: { duration: durations.fast, ease: easings.out },
  normal: { duration: durations.normal, ease: easings.out },
  slow: { duration: durations.slow, ease: easings.inOut },
} satisfies Record<string, Transition>;

/** Page-level enter/exit: barely-there fade with a 4px rise. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: transitions.normal },
  exit: { opacity: 0, y: -4, transition: transitions.fast },
};

/** For lists that stagger children in on mount. */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.03 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: transitions.normal },
};
