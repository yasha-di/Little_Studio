# Little Studio Beta v0.31.1

First public beta of **Little Studio** — a desktop studio for AI video
generation that works like a film production, not a chat log.

Write a scene, generate takes through the OpenRouter video API, keep every
version, and build your film project by project — with live model
capabilities and fully transparent pricing.

## ✨ Highlights

### 🎬 A filmmaker's workflow

- Projects → scenes → takes: every generation is an immutable **take** with
  the exact prompt and settings that produced it — history is never
  rewritten.
- A git-like version tree per scene: retake, remix, preview any version.
- Cross-project **Library** of every clip you've generated: play, download,
  reveal on disk, copy the prompt.

### 💰 Transparent pricing

- Model cards show the honest catalog price ("from $0.04/s") — and the app
  shows the **real** price of your selected configuration everywhere it
  changes:
  - per-option prices right inside the resolution and aspect-ratio selectors,
  - an exact price-per-second row in the Inspector,
  - a live cost estimate whose tooltip spells out the arithmetic
    (`$0.15/s × 8s`).
- Estimates and rates resolve through one pricing engine fed by the
  provider's published prices — never approximated, never cached stale, and
  honestly "unknown" (with the reason) when the published pricing doesn't
  pin down a number.

### 🧠 Live model capabilities

- The model catalog, capabilities and prices come straight from OpenRouter
  metadata: durations, resolutions, aspect ratios, audio, seed, start/end
  frames, negative prompt. Nothing is hardcoded.
- Controls a model cannot deliver are simply absent; upcoming features
  appear as locked rows that unlock the moment a model reports them.
- Text to Video, Image to Video and Start → End frame guidance, each gated
  by real model support.

### 🌍 Localization

- Full English and Russian dictionaries, switchable at runtime — including
  price labels, estimate explanations and accessibility labels. Translations
  are compile-checked: a missing key is a build error.

### 🔒 Local-first & private

- Projects, scenes and history live on your machine.
- The OpenRouter API key is validated before being stored, kept in a local
  secret store, masked in the UI and redacted from every log line.
- The app talks to exactly one host: `openrouter.ai`.

### ⚡ Stability

- Crash-safe single-concurrency generation queue with cancellation and
  resume-on-launch.
- Fail-soft provider metadata handling: a malformed catalog entry is skipped
  and logged, never fatal — and no paid request is risked on unreported
  parameters.

## 📦 Downloads

| Platform | File                                                  |
| -------- | ----------------------------------------------------- |
| Windows  | `Little Studio_0.31.1_x64-setup.exe` (NSIS installer) |
| Windows  | `Little Studio_0.31.1_x64_en-US.msi` (MSI installer)  |
| macOS    | `Little Studio_0.31.1_aarch64.dmg`                    |

> macOS builds are currently unsigned — right-click the app and choose
> **Open** on first launch. Windows SmartScreen may warn on first run for
> the same reason.

## Known limitations

- Extend and Loop modes are visible but locked (coming in a future update).
- No auto-update yet — install new versions manually.
- Builds are unsigned (no code-signing certificate yet).

---

**Full changelog**: see [CHANGELOG.md](../CHANGELOG.md).
