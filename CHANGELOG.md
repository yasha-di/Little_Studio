# Changelog

All notable changes to Little Studio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v0.31.1 Beta — 2026-07-11

First public beta.

### Highlights

- **Transparent pricing** — the real price of the selected configuration is
  visible everywhere it changes: per-option prices inside the resolution and
  aspect-ratio selectors, an exact price-per-second row in the Inspector, and
  a status-bar estimate whose tooltip spells out the arithmetic
  (`$0.15/s × 8s`). Model cards keep the honest "from …" catalog teaser.
- **Accurate estimation** — cost estimates and per-second rates resolve
  through the same published-pricing rules (per-second SKUs, Seedance-style
  video-token billing, per-request prices), so they can never disagree.
  Unknown stays unknown: the app never averages, approximates or invents a
  number, and always explains what to select to see the price.
- **Unified pricing engine** — one estimation input feeds the Inspector, the
  status bar and the selector hints; ambiguous published pricing names the
  exact dimension (resolution, audio) that still needs a choice.
- **Pricing inspector** — the Output group shows rate, estimated cost and
  actual cost side by side, with honest tooltips for every unknown.
- **Better localization** — full English and Russian dictionaries with zero
  hardcoded copy: price labels, estimate explanations, dialog accessibility
  labels and selector annotations all render in the active language.
- **UI polish** — cleaner price formatting, quieter selectors on flat-priced
  models, capability-driven controls that hide instead of taunting, guided
  next-step hints in the composer.
- **Stability improvements** — crash-safe single-concurrency generation
  queue with resume-on-launch, fail-soft provider metadata handling, and a
  strict TypeScript/ESLint/Prettier pipeline enforced at zero warnings.

### Under the hood

- Dynamic model capabilities read live from the OpenRouter catalog
  (durations, resolutions, aspect ratios, audio, seed, start/end frames,
  negative prompt via provider passthrough) — nothing is hardcoded.
- Generation history is a git-like immutable version tree: every take keeps
  the exact prompt and settings that produced it.
- API keys are validated before being stored, live only in the local Tauri
  secret store, and are redacted from every log line.
