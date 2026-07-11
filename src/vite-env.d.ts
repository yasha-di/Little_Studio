/// <reference types="vite/client" />

// Self-hosted fonts ship CSS entry points without type declarations.
declare module "@fontsource-variable/inter";
declare module "@fontsource-variable/jetbrains-mono";

/** Injected by Vite `define` from package.json — see vite.config.ts. */
declare const __APP_VERSION__: string;
