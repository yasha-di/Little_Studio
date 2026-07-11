# Little Studio

**Creative AI Video Workspace** — a modern desktop studio for AI video
generation. Write a scene, generate takes, keep every version.

Little Studio turns AI video generation into a filmmaker's workflow: your
work lives in **projects**, each project is built **scene by scene**, and
every generation is an immutable **take** you can revisit, compare and
continue. Generation runs through the [OpenRouter](https://openrouter.ai)
video API, so one key gives you the current frontier models (Veo, Kling,
Seedance, Sora, Wan and more) with live, transparent pricing.

> **Status: Beta (v0.31.1).** The full creative loop is live end-to-end.
> Expect rough edges; feedback is very welcome.

## Features

- 🎬 **Projects → scenes → takes** — a film-production structure instead of
  a chat log. Every take stores the exact prompt and settings that made it;
  history is never rewritten.
- ✍️ **Guided prompt composer** — the composer always names your next step,
  from "connect a provider" to "describe your shot", with a negative-prompt
  field for models that support it.
- 🧠 **Live model catalog** — every video model available to your OpenRouter
  account, with capabilities (durations, resolutions, aspect ratios, audio,
  seed, start/end frames, negative prompt) read dynamically from provider
  metadata. Nothing is hardcoded.
- 🎛 **Capability-driven Inspector** — controls a model cannot deliver simply
  are not there; upcoming features appear as locked rows that unlock the
  moment a model reports them.
- 💰 **Transparent pricing** — real prices from the provider's published
  catalog: per-option prices inside the resolution/aspect selectors, the
  exact $/s of your current configuration, and a cost estimate that never
  approximates. Unknown prices stay honestly unknown, with an explanation.
- 🖼 **Image-driven modes** — Text to Video, Image to Video and Start → End
  frame guidance, gated by what the selected model actually supports.
- 🌱 **Seed control & audio toggle** — pin randomness for repeatable takes,
  generate audio where models support it.
- 📼 **Take history & version tree** — a git-like tree of takes per scene:
  retake, remix, compare, and preview any version with its full snapshot.
- 📚 **Library** — every generated clip across all projects: play, download,
  reveal in the file manager, copy the prompt that made it.
- 🔒 **Local-first & private** — projects, scenes and history are stored on
  your machine. The API key is validated, stored in a local secret store and
  redacted from logs. The app talks to exactly one host: `openrouter.ai`.
- 🌍 **English & Russian** UI, switchable at runtime.
- ⚡ **Native desktop app** — Tauri 2 shell, dark cinematic theme, crash-safe
  generation queue that resumes after a restart.

## Screenshots

> _Screenshots coming with the first public release build._
>
> <!-- Add screenshots to docs/screenshots/ and reference them here:
> ![Workspace](docs/screenshots/workspace.png)
> ![Model picker](docs/screenshots/model-picker.png) -->

## Installation

Grab the installer for your platform from the
[Releases](../../releases) page:

| Platform | Artifact                                              |
| -------- | ----------------------------------------------------- |
| Windows  | `Little Studio_0.31.1_x64-setup.exe` (NSIS) or `.msi` |
| macOS    | `Little Studio_0.31.1_aarch64.dmg` / `.app`           |

Then:

1. Launch Little Studio.
2. Open **Preferences → OpenRouter** and paste your
   [OpenRouter API key](https://openrouter.ai/keys) (it is validated before
   being stored, and never leaves your machine otherwise).
3. Create a project, write a scene, pick a model — and generate your first
   take.

> macOS builds are currently unsigned: right-click the app → **Open** on
> first launch.

## Development

Prerequisites: [Node.js](https://nodejs.org) ≥ 20,
[Rust toolchain](https://rustup.rs) (stable), and on Windows the Microsoft
C++ Build Tools + WebView2 (preinstalled on Windows 10/11). The web frontend
builds and runs without Rust.

```bash
npm install
npm run dev        # web dev server (http://localhost:1420)
npm run tauri dev  # full desktop shell (requires Rust toolchain)
```

### Scripts

| Script                | Purpose                                |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Vite dev server                        |
| `npm run build`       | typecheck + production bundle          |
| `npm run tauri dev`   | desktop app in dev mode                |
| `npm run tauri build` | distributable executables + installers |
| `npm run typecheck`   | strict TS project check                |
| `npm run lint`        | ESLint, zero warnings tolerated        |
| `npm run format`      | Prettier (with Tailwind class sorting) |

## Building

```bash
npm run tauri build
```

Produces platform-native bundles under `src-tauri/target/release/bundle/`:

- **Windows**: standalone `little-studio.exe` (`src-tauri/target/release/`),
  NSIS setup (`bundle/nsis/*-setup.exe`) and MSI (`bundle/msi/*.msi`)
- **macOS**: `bundle/macos/Little Studio.app` and `bundle/dmg/*.dmg`
- **Linux**: `bundle/deb/*.deb`, `bundle/rpm/*.rpm`, `bundle/appimage/*.AppImage`

Each platform must be built on its own OS (Tauri does not cross-compile).
Icons regenerate from the master `app-icon.svg` via
`npm run tauri icon -- app-icon.svg`.

## Tech Stack

| Layer         | Choice                             |
| ------------- | ---------------------------------- |
| Desktop shell | Tauri 2 (Rust)                     |
| UI            | React 19 + TypeScript (strict)     |
| Build         | Vite 8                             |
| Styling       | Tailwind CSS 4 (CSS-first tokens)  |
| Components    | shadcn/ui-style primitives (Radix) |
| Motion        | Framer Motion                      |
| Client state  | Zustand                            |
| Server state  | TanStack Query                     |
| Forms         | React Hook Form + Zod              |
| Routing       | React Router (hash history)        |
| Icons         | Lucide                             |

## Architecture

```
src/
├── app/            # Composition root: providers, router. The only place
│                   # where everything is wired together.
├── core/           # App-wide primitives: config, error hierarchy, logging,
│                   # query-key & storage-key registries. Depends on nothing.
├── features/       # Vertical slices (projects, library, settings).
│                   # Each exposes a public API via index.ts;
│                   # deep imports are blocked by an ESLint rule.
├── components/
│   ├── ui/         # Design-system primitives (shadcn-style, Radix-based).
│   └── shared/     # App-specific composites (Logo, PageHeader, EmptyState,
│                   # connection status, VideoCard, ProjectCard).
├── layouts/        # Desktop chrome: AppShell, Sidebar, TopBar.
├── services/       # The boundary to the outside world:
│   ├── openrouter/ #   HTTP client (zod-validated DTOs) + session that owns
│   │               #   the API-key lifecycle and connection state machine.
│   ├── providers/  #   VideoGenerationProvider contract + registry +
│   │               #   OpenRouterVideoProvider + connection store.
│   ├── capabilities/# Capability Registry: what a model reports × what this
│   │               #   build can deliver, as typed reasons — one source for
│   │               #   every "is X available?" question in the UI.
│   ├── generation/ #   The generation queue: snapshot → submit → poll →
│   │               #   download → attach; live task store (zustand);
│   │               #   error → user-facing JobFailure mapping.
│   ├── media/      #   Media library: videos on disk (Tauri fs + asset
│   │               #   protocol), save-as dialog, reveal in Explorer.
│   ├── repositories/# Repository contracts + storage-backed implementations
│   │               #   (projects, scenes, generations, versions, jobs,
│   │               #   results, reference images, templates, settings,
│   │               #   history).
│   ├── pricing/    #   Cost estimation from published catalog prices;
│   │               #   estimates and per-second rates share one SKU
│   │               #   resolution engine, and "unknown" is first-class.
│   ├── secrets/    #   SecretStorage for API keys (Tauri Store namespace).
│   └── persistence/#   KeyValueStorage: Tauri Store (desktop) or
│                   #   localStorage (browser dev), chosen by one factory.
├── stores/         # Global client state (Zustand): UI chrome, settings.
├── hooks/          # React bindings (connection, models, capability & price
│                   # text bridges between typed services and i18n).
├── i18n/           # Homegrown, dependency-free localization: en is the
│                   # typed reference dictionary, translations are compile-
│                   # checked, plurals via Intl.PluralRules.
├── lib/            # Pure logic: cn(), motion vocabulary, http core
│                   # (timeout/retry), version-tree functions.
├── types/          # Domain model with branded IDs. Zero dependencies.
└── styles/         # Tailwind 4 theme tokens (dark only).
```

### Dependency direction

```
features / layouts ──► hooks ──► services ──► core / lib / types
components ──► lib / types (+ provider contract types)
core, types ──► (nothing)
```

`app/` sits on top and may import anything; nothing imports `app/`.
Features never import each other — cross-feature needs must be promoted
into `services`, `stores` or `components/shared`.

### Domain model

```
Project ─┬─ Scene (order, startImage, endImage, loop config)
         │    └─ Generation (creative intent)
         │         └─ GenerationVersion tree (git-like):
         │              parentId + operation ∈ {initial, regenerate, remix, extend}
         │              ├─ immutable PromptSnapshot + GenerationSettings
         │              ├─ GenerationJob (mutable execution: status, progress,
         │              │                 cost estimate/actual, timing, failure)
         │              └─ GenerationResult (immutable artifact)
         ├─ Prompt / PromptTemplate (text, negative, variables, tags, metadata)
         └─ ReferenceImage (local file | url | generated frame of a version)
```

Key invariants:

- **Versions are immutable**; anything that changes over time lives on the
  job. Prompt/settings are stored by value (snapshots), so editing a prompt
  later can never rewrite history.
- **Parent links are the only stored tree structure**; children/branches/
  lineage are derived by pure functions in `lib/version-tree.ts` (cycle-safe,
  orphan-aware). Two sources of truth would eventually disagree.
- **Unknown provider data is `null`, never guessed** — capabilities, prices
  and costs render as honestly unknown with a reason, not as invented values.

### Key decisions (and why they scale)

- **Provider abstraction (`services/providers`).** The UI depends on the
  `VideoGenerationProvider` interface, never on OpenRouter. Adding a second
  backend is: implement the interface, add one `registerProvider()` line.
  Wire formats are mapped to domain types inside each provider, so external
  API changes never propagate past the service boundary.
- **Capability Registry (`services/capabilities`).** Every "can the user do
  X?" answer combines what the model reports with what this build ships,
  expressed as typed reasons the UI translates — no scattered boolean logic.
- **One pricing engine (`services/pricing`).** Cost estimates, per-second
  rates and selector price hints all resolve through the same published-SKU
  matching rules, so no two screens can disagree about a price.
- **Branded entity IDs (`types/`).** `ProjectId` and `CollectionId` are both
  strings at runtime but incompatible at compile time — a whole class of
  "passed the wrong id" bugs is eliminated before it exists.
- **Query-key & storage-key registries (`core/constants`).** Cache
  invalidation and persisted data stay reliable only if keys are
  centralized. Hand-written keys at call sites are banned.
- **Zustand for client state, TanStack Query for server state.** They are
  different problems: Query owns caching/retries/invalidation of remote
  data; Zustand owns synchronous UI state (sidebar collapse). Mixing them
  in one store is how web dashboards rot.
- **Hash routing.** Tauri serves the production bundle from a custom
  protocol; hash history cannot 404 on reload and is invisible in a
  desktop window.
- **Dark-only theme as CSS tokens (`styles/globals.css`).** Every color is
  an oklch design token following the shadcn naming contract — any shadcn
  component drops in already themed, and a palette change is a one-file edit.
- **Strict everything.** `strict` TS + `exactOptionalPropertyTypes` +
  `noUncheckedIndexedAccess`, typed ESLint rules, `--max-warnings 0`.
  Foundations only stay clean if the tooling refuses to let them decay.

## Roadmap

- [ ] **Extend** — continue a take past its last frame
- [ ] **Loop** — seamlessly looping clips
- [ ] **Camera motion controls** — direct pans, zooms and orbits
- [ ] **Motion brush** — paint motion onto regions of the frame
- [ ] **Character & style references** — keep a look consistent across scenes
- [ ] **Command palette** (registry already in place)
- [ ] **More providers** behind the same `VideoGenerationProvider` contract
- [ ] Screenshots, auto-updates and signed builds

Locked roadmap features are already visible inside the app and unlock
automatically once a connected model reports the capability.

## License

[MIT](LICENSE) © 2026 Little Studio
