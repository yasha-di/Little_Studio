# Release Checklist

Everything required to publish a Little Studio release. Work top to
bottom; every box must be checked before the tag is pushed.

## 1. Code freeze

- [ ] Working tree clean, `main` up to date with `origin/main`.
- [ ] No feature work in flight — release commits contain only version
      bumps, docs and build fixes.
- [ ] `npm run typecheck` — clean.
- [ ] `npm run lint` — clean at zero warnings.
- [ ] `npm run format:check` — clean.
- [ ] `npm run build` — production frontend builds without errors.
- [ ] `cargo check` inside `src-tauri/` — clean.

## 2. Version bump (four places + lockfile)

The version lives in **four files** that must always agree:

- [ ] `package.json` → `"version"`
- [ ] `src-tauri/tauri.conf.json` → `"version"`
- [ ] `src-tauri/Cargo.toml` → `version`
- [ ] `src-tauri/Cargo.lock` → the `little-studio` package entry
      (run `cargo check` in `src-tauri/` to regenerate, or edit the entry)
- [ ] `npm install --package-lock-only` → syncs `package-lock.json`

The About dialog and window metadata read the version from
`package.json` (injected as `__APP_VERSION__` at build time) — never
hardcode a version string in source.

## 3. Docs

- [ ] `CHANGELOG.md` — new section for this version, dated, following
      Keep a Changelog.
- [ ] `RELEASE_NOTES.md` — rewritten for this release (highlights,
      limitations, known issues, download table with exact file names).
- [ ] `README.md` — status line / version badge still correct.
- [ ] Screenshots still match the current UI (retake if the UI changed).

## 4. Release configuration sanity

- [ ] `src-tauri/tauri.conf.json`: `productName`, `identifier`,
      `bundle.targets: "all"`, publisher/copyright/category/license
      metadata present.
- [ ] Icons present in `src-tauri/icons/` (`icon.ico`, `icon.icns`,
      `32x32.png`, `128x128.png`, `128x128@2x.png`). If the master
      `app-icon.svg` changed, regenerate with
      `npm run tauri icon -- app-icon.svg` (note: the CLI rejects XML
      comments inside the SVG).
- [ ] CSP in `tauri.conf.json` still allows exactly the hosts the app
      needs (`'self'` + `https://openrouter.ai` + asset/ipc protocols).
- [ ] No secrets, personal paths or debug flags in the repo
      (`.claude/` is gitignored; React Query devtools are DEV-only).

## 5. Build — Windows (local or CI)

- [ ] `npm run tauri build`
- [ ] Artifacts appear under `src-tauri/target/release/`:
  - [ ] `little-studio.exe` (standalone)
  - [ ] `bundle/nsis/Little Studio_<version>_x64-setup.exe`
  - [ ] `bundle/msi/Little Studio_<version>_x64_en-US.msi`
- [ ] `little-studio.exe` file properties show the right ProductVersion.

## 6. Build — macOS (CI; cannot be built on Windows)

Tauri does not cross-compile: macOS bundles must be built on macOS.
The GitHub Actions workflow (`.github/workflows/release.yml`) builds
them on a tag push or manual dispatch.

- [ ] CI run green for `aarch64-apple-darwin` and `x86_64-apple-darwin`.
- [ ] Artifacts: `Little Studio.app` + `Little Studio_<version>_*.dmg`.
- [ ] No notarization step ran (beta ships unsigned by policy).

## 7. Artifact verification (every platform you ship)

- [ ] Fresh install from the installer (not an in-place dev build).
- [ ] App launches to the welcome screen; no console/log errors.
- [ ] Window title and taskbar/dock icon are correct.
- [ ] About dialog shows the release version.
- [ ] Connect an OpenRouter key → model catalog loads with prices.
- [ ] One smoke generation completes end-to-end (or, without spending
      credits: the Generate button enables and the estimate resolves).
- [ ] Uninstaller removes the app (Windows).

## 8. Tag & publish

- [ ] Commit release changes
      (`chore(release): v<version>` or `feat: release v<version>`).
- [ ] Annotated tag: `git tag -a v<version> -m "Little Studio v<version>"`.
- [ ] `git push origin main --tags`.
- [ ] GitHub Release drafted from `RELEASE_NOTES.md`, marked
      **pre-release** while in beta.
- [ ] Upload/attach: NSIS `.exe`, `.msi`, both `.dmg` files.
- [ ] Download each published asset once and verify checksums/launch.

## 9. After publishing

- [ ] Verify the release page renders correctly (links, tables, warnings).
- [ ] Smoke-download on a machine that never had the app installed.
- [ ] Note any first-run warnings (SmartScreen/Gatekeeper wording) for
      the support docs.
- [ ] Open issues for anything found but not fixed — nothing lives only
      in someone's head.

## Non-goals while in beta

- No code signing / notarization (revisit before 1.0).
- No auto-updater (revisit before 1.0).
- No store submissions.
