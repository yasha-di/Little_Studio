# Little Studio Beta v0.31.2 — Release Notes

First public beta of **Little Studio** — a desktop studio for AI video
generation that works like a film production, not a chat log. Write a
scene, generate takes through the OpenRouter video API, keep every
version, and build your film project by project.

This release is the v0.31 feature line plus the v0.31.2
pricing-transparency fix pass. No account, no telemetry, no cloud —
everything except the generation itself happens on your machine.

---

## ✨ Highlights of v0.31

### 🎞 Start → End frame guidance

- New **Start → End** generation mode: guide both the first and the last
  frame of a shot with your own images.
- Both frame slots are real upload slots, gated by what the selected model
  actually reports (`first_frame` / `last_frame` support in the OpenRouter
  catalog) — 10 of 16 catalog models support end frames today.
- Frames are mode-gated at snapshot time: a start image left over from an
  earlier experiment can never silently ride along into a Text → Video
  take.

### 🚫 Negative Prompt

- The composer's negative prompt is now sent end-to-end for models that
  support it (Kling, Wan, Veo …), using each provider's own passthrough
  parameter name — resolved live from OpenRouter metadata, never guessed.
- When the selected model does not support it, the field hides (empty) or
  explains itself (text already written) — it never poses as a working
  input, and the text stays safely with your scene.

### 🌍 Localization

- Full **English and Russian** interfaces, switchable at runtime in
  Preferences — including price labels, estimate explanations, tooltips
  and accessibility labels.
- Translations are compile-checked: a missing key is a build error, not a
  runtime surprise.

### 🧠 Capability Registry

- One registry answers every "can this model do X?" question in the UI —
  chips, mode availability, frame slots, seed/audio controls, locked rows.
- Two honest gates: what the model reports (live OpenRouter metadata) and
  what this build can deliver end-to-end. Controls a model cannot deliver
  are absent, upcoming features appear as locked rows with a reason.
- Nothing is hardcoded: durations, resolutions, aspect ratios, audio,
  seed, frame guidance and negative prompt support all come from the live
  catalog.

### 💰 Pricing Transparency

- Model cards show the honest catalog teaser ("from $0.04/s") — and the
  app shows the **real** price of your selected configuration everywhere
  it changes:
  - per-option prices right inside the resolution and aspect-ratio
    selectors (`1080p · $0.15/s`),
  - an exact price-per-second row in the Inspector,
  - a live cost estimate whose tooltip spells out the arithmetic
    (`$0.15/s × 8s`).
- One pricing engine feeds the Inspector, the status bar and the selector
  hints, so they can never disagree. Estimates are never approximated and
  never cached stale; "unknown" is a first-class answer with the exact
  reason ("the price depends on resolution — pick one to see it").
- **Fixed in v0.31.2:** when a model prices per resolution and none is
  selected yet, the estimate now honestly asks for a resolution instead of
  claiming no price exists — or worse, showing a flat base price that
  jumped the moment a surcharged resolution (e.g. 1080p) was chosen.

---

## 📦 Downloads

| Platform | File | Notes |
| -------- | ---- | ----- |
| Windows 10/11 x64 | `Little Studio_0.31.2_x64-setup.exe` | NSIS installer (recommended) |
| Windows 10/11 x64 | `Little Studio_0.31.2_x64_en-US.msi` | MSI installer |
| macOS 10.15+ | `Little Studio_0.31.2_aarch64.dmg` | Apple Silicon, built via CI |
| macOS 10.15+ | `Little Studio_0.31.2_x64.dmg` | Intel, built via CI |

> All builds are **unsigned** (no code-signing certificate yet).
> Windows SmartScreen may warn on first run — choose "More info → Run
> anyway". On macOS, right-click the app and choose **Open** on first
> launch. macOS builds are not notarized.

---

## ⚠️ Beta limitations

- **Bring your own key.** Generation requires an OpenRouter API key with
  credits; connect it in Preferences. The key is validated, stored only in
  the local secret store, masked in the UI and redacted from logs.
- **Extend and Loop modes are visible but locked** — the OpenRouter video
  API does not accept video input yet; they unlock in a future update.
- **One generation at a time.** The queue accepts any number of jobs but
  runs them strictly sequentially (by design for the beta).
- **No auto-update.** Install new versions manually over the old one.
- **Camera Motion, Motion Brush, Character/Style Reference** appear as
  locked rows — they unlock per model as providers start reporting them.

## 🐞 Known issues

- Canceling a running generation stops it locally only — OpenRouter has no
  cancel API, so credits already spent on the provider side are lost.
- Most models report no numeric progress; the app shows a spinner and live
  phase instead of a percentage bar.
- The cost estimate reflects the provider's *published* catalog prices;
  the billed amount can differ in edge cases — the actual cost is always
  shown after the take completes.
- A model that disappears from the OpenRouter catalog shows as
  "not in catalog" on scenes that used it; pick a current model to
  generate again.
- Very long prompts can make the composer card taller than the viewport on
  small screens; the workspace scrolls, but the layout is tuned for
  1280×800 and up.

---

**Full changelog:** see [CHANGELOG.md](CHANGELOG.md).
**Feedback:** please open a GitHub issue — this beta exists to find rough
edges.
