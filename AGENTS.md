# AGENTS.md — batch-compresser

Guide for humans and AI agents working on this repo. Prefer this file over guessing from chat history.

## What this is

Cross-platform **CLI TUI** (Ink + React) for **batch compression** of photos and videos in a folder.

Architecture is **MVP**: `SessionPresenter` owns the session FSM; Ink is a thin View over an immutable `AppViewModel`. Domain lives in `source/core` (no React/Ink); UI + Node adapters live in `source/tui`. Future GUI can bind the same Presenter.

- **UI language:** Russian only (`source/tui/i18n/ru.ts`)
- **Photos:** `sharp` (quality, megapixel downscale, format JPEG/WebP/same)
- **Videos:** system `ffmpeg` → H.264 + AAC in MP4 (CRF, max height)
- **Output:** replace in place **or** sibling `*_compressed.*`
- **Safety:** skip tiny files (separate MB thresholds), skip `*_compressed*`, skip if result ≥ original; **videos** also keep original if savings &lt; 3%
- **Resume:** optional `previousLogsPath` (log file or folder) skips paths already logged as `OK` / `SKIP_LARGER` / `SKIP_LOW_GAIN` / `SKIP_USER`
- **Interactive skip:** during run, ↑↓ focus an active video, `s` + Enter aborts ffmpeg (`skip_user`); original kept; temps/staging cleaned
- **Runtime video workers:** `[` / `]` change concurrency mid-run (drain on decrease — no abort); loadavg/RAM advice on screen (manual only, no auto-tune)
- **ffmpeg missing:** offer confirmed install via brew/apt/dnf/pacman/winget/choco; Esc = photos only
- **Open folder:** during run, `o` opens the original video’s parent folder; labels show `parent/file`
- **Celebratory summary:** core computes `durationTier`; TUI picks Russian title/banner
- **Log:** `batch-compresser-YYYYMMDD-HHmmss.log` — English `=== SETTINGS ===` / `=== SUMMARY ===` keys; per-file lines stay `STATUS | kind | path | …` (resume-safe)

## Stack

| Layer       | Choice                                                                          |
| ----------- | ------------------------------------------------------------------------------- |
| Runtime     | Node ≥ 16, ESM (`"type": "module"`)                                             |
| Language    | TypeScript (`rootDir: ./source`, `outDir: dist`)                                |
| Layout      | `source/core/**` (domain) + `source/tui/**` (Ink View + adapters)               |
| TUI         | Ink 4 + React 18                                                                |
| Inputs      | `ink-text-input`, custom `Select`                                               |
| Photos      | `sharp`                                                                         |
| Videos      | system `ffmpeg` / `ffprobe` via `execa`                                         |
| CLI flags   | `meow` (`--path` / `-p`)                                                        |
| Concurrency | photos: `p-limit`; videos: adjustable limiter (`videoWorkers`, runtime `[`/`]`) |
| Lint/test   | prettier, xo, ava (`test/**/*.test.js` against `dist/`)                         |

**Do not** reintroduce the npm `ffmpeg` package — only the system binary.

## Commands

```bash
npm install
npm run build          # tsc → dist/
npm start              # node dist/tui/cli.js
npm test               # prettier + xo + build + ava
npm run dev            # tsc --watch
```

Entry: `source/tui/cli.tsx` → `dist/tui/cli.js` (bin).

## Architecture

```
tui/cli.tsx
 └─ tui/wire.ts              # Node AppPorts + SessionPresenter
 └─ tui/App.tsx              # subscribe VM; keys → presenter commands
      ├─ screens/* / wizard/*
      ├─ i18n/ru.ts
      └─ adapters/*          # FfmpegPort / FsPort / ProcessPort impls
core/app/SessionPresenter.ts # FSM: boot → … → summary
core/app/view-model.ts       # AppViewModel
core/ports/                  # FfmpegPort, FsPort, ProcessPort
core/compress/               # run, photo, video, write, …
core/scan.ts, log.ts, …
```

### Ports

| Port          | Responsibility                                                         |
| ------------- | ---------------------------------------------------------------------- |
| `FfmpegPort`  | `check`, `probeVideo`, `listFormatsText`                               |
| `FsPort`      | `validateDirectory`, `pickFolder` / `pickFile`, `openContainingFolder` |
| `ProcessPort` | `detectInstallPlan`, `installFfmpeg`                                   |

Core must not import React/Ink. TUI must not call `runCompression` / `scanDirectory` directly — only Presenter commands.

### Screen flow

```
boot → (ffmpegWarn? → optional install) → wizard(steps 1–7) → scanning → confirm → running → summary
```

Wizard steps (see `core/wizard-nav.ts` + `tui/ui/wizard-titles.ts`):

1. Path (validate + optional OS folder picker)
2. Media types (photo/video toggles)
3. Min size thresholds (MB)
4. Photo settings — skipped if photos off
5. Video settings — skipped if no ffmpeg / videos off
6. Replace vs `_compressed`, workers, staging, previous logs
7. Ready → scan

### Compression pipeline

1. `createLogger` — writes `=== SETTINGS ===` (EN keys)
2. `scanDirectory` — recursive; min-size / `*_compressed` / previous-log skips
3. Photos parallel (`photoWorkers`); videos adjustable pool (`videoWorkers`)
4. Optional staging HDD→SSD; `commitOutput` discard if not smaller
5. Summary on screen + `=== SUMMARY ===` in log

## Conventions for changes

1. **Prefer `type` over `interface`**.
2. Russian strings only in `tui/i18n/ru.ts`.
3. New wizard step → `tui/wizard/` + `wizard-nav` / titles.
4. New screen → `tui/screens/` + branch in `tui/App.tsx` (render only; logic in Presenter).
5. Tests import from **`dist/`** (after `tsc`). Presenter tests use fake ports; Ink smoke via `ink-testing-library`.
6. Run `npm test` before claiming done.
7. Do not edit plan files under `.cursor/plans/` unless asked.

## Where to change what

| Goal                   | Touch                                                                            |
| ---------------------- | -------------------------------------------------------------------------------- |
| Session FSM / commands | `core/app/SessionPresenter.ts`, `view-model.ts`                                  |
| Ports / adapters       | `core/ports/*`, `tui/adapters/*`, `tui/wire.ts`                                  |
| New CLI flag           | `tui/cli.tsx`                                                                    |
| Default settings       | `core/defaults.ts`, `presets.ts`                                                 |
| Log format             | `core/log.ts`                                                                    |
| Photo / video encode   | `core/compress/photo.ts`, `video.ts`                                             |
| Scan extensions        | `core/scan.ts`, `video-extensions.ts`                                            |
| Celebration copy       | `tui/ui/celebration.ts`, `tui/i18n/ru.ts` (`durationTier` in `core/duration.ts`) |

## Out of scope (v1 — do not add unless requested)

- English / i18n switcher for TUI
- Bundled ffmpeg binary
- Desktop GUI (Electron/Tauri) — Presenter is ready; ship separately
- Full EXIF preservation
- Multiple root folders in one run

## Mental model for agents

User configures in the wizard → confirm → Presenter walks the tree and compresses with clear logging. View only renders `AppViewModel` and dispatches semantic commands. Correctness and “don’t make files bigger” matter more than micro-optimizations.
