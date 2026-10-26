# AGENTS.md — batch-compresser

Guide for humans and AI agents working on this repo. Prefer this file over guessing from chat history.

## What this is

Cross-platform **CLI TUI** (Ink + React) for **batch compression** of photos and videos in a folder.

- **UI language:** Russian only (`source/i18n/ru.ts`)
- **Photos:** `sharp` (quality, megapixel downscale, format JPEG/WebP/same)
- **Videos:** system `ffmpeg` → H.264 + AAC in MP4 (CRF, max height)
- **Output:** replace in place **or** sibling `*_compressed.*`
- **Safety:** skip tiny files (separate MB thresholds), skip `*_compressed*`, skip if result ≥ original; **videos** also keep original if savings &lt; 3%
- **Log:** `batch-compresser-YYYYMMDD-HHmmss.log` in the target folder (settings header + per-file lines + summary)

## Stack

| Layer       | Choice                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| Runtime     | Node ≥ 16, ESM (`"type": "module"`)                                           |
| Language    | TypeScript (`rootDir: ./source`, `outDir: dist`)                              |
| TUI         | Ink 4 + React 18                                                              |
| Inputs      | `ink-text-input`, custom `Select`                                             |
| Photos      | `sharp`                                                                       |
| Videos      | system `ffmpeg` / `ffprobe` via `execa`                                       |
| CLI flags   | `meow` (`--path` / `-p`)                                                      |
| Concurrency | `p-limit` — photos (`photoWorkers`) and videos (`videoWorkers`) both parallel |
| Lint/test   | prettier, xo, ava (`test/**/*.test.js` against `dist/`)                       |

**Do not** reintroduce the npm `ffmpeg` package — only the system binary.

## Commands

```bash
npm install
npm run build          # tsc → dist/
npm start              # node dist/cli.js
npm test               # prettier + xo + build + ava
npm run dev            # tsc --watch
```

Entry: `source/cli.tsx` → `dist/cli.js` (bin).

## Architecture

```
cli.tsx
  └─ app.tsx                 # Screen FSM + settings state + orchestration
       ├─ screens/*          # boot / ffmpeg warn / scan / confirm / run / summary
       ├─ wizard/*           # multi-step settings wizard
       ├─ compress/run.ts    # scan → process → log → summary
       │    ├─ photo.ts      # sharp pipeline
       │    ├─ video.ts      # ffmpeg + progress pipe
       │    ├─ write.ts      # temp file, skip_larger, atomic commit
       │    └─ ffmpeg-progress.ts
       ├─ scan.ts            # recursive walk + filters
       ├─ log.ts             # settings header, file lines, summary
       ├─ ffmpeg.ts          # availability + ffprobe
       ├─ fs/*               # validate dir, native folder picker
       ├─ presets.ts         # quality/CRF presets, MP math, naming
       ├─ defaults.ts        # default CompressSettings
       ├─ types.ts           # shared domain types (prefer `type`, not interface)
       └─ i18n/ru.ts         # all user-facing strings
```

### Screen flow

```
boot → (ffmpegWarn?) → wizard(steps 1–7) → scanning → confirm → running → summary
```

Wizard steps (see `ui/types.ts` / `wizard/Wizard.tsx`):

1. Path (validate + optional OS folder picker)
2. Media types (photo/video toggles)
3. Min size thresholds (MB)
4. Photo settings (format, MP, quality/preset)
5. Video settings (CRF/preset, max height) — skipped if no ffmpeg / videos off
6. Replace vs `_compressed`, photo/video workers, optional HDD→SSD staging
7. Ready → scan

### Compression pipeline

1. `createLogger(rootDir, settings)` — writes `=== ПАРАМЕТРЫ ===` first
2. `scanDirectory` — recursive; classifies by extension; applies min-size and `*_compressed` skips
3. Photos: parallel (`photoWorkers`, default `cpus()-1`)
4. Videos: parallel (`videoWorkers`, default `min(4, floor(cpus/2))`); per-file progress via `ffmpeg -progress pipe:1`
5. Optional **staging** (`stageToFastDisk`): copy HDD → SSD tmp → encode → **delete staged input immediately** → write result back (EXDEV-safe `moveFile`); session dir cleaned in `finally`
6. `commitOutput` — write `.tmp*`, compare sizes, rename/copy or discard (`skip_larger`)
7. Final summary on screen and at end of log; staging session dir cleaned in `finally`

### Progress events

`ProgressEvent` in `compress/run.ts`:

- Batch: `done` / `total` / `current`
- Per file: `kind`, `status` (`probe` | `encode` | `finalize` | …), `filePercent` (videos)
- Parallel: `activeJobs[]` — all in-flight files (RunningScreen lists each with its own bar)

UI: `screens/RunningScreen.tsx`.

## Key domain rules

| Topic          | Behavior                                                                | Where                                     |
| -------------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| Photo MP       | Downscale only if `w*h` > target MP; keep aspect                        | `presets.scaledSize`, `compress/photo.ts` |
| Photo format   | `same` / `jpeg` / `webp`; HEIC etc. → JPEG when “same” needs conversion | `compress/photo.ts`                       |
| EXIF           | Apply orientation (`rotate()`); do not copy other EXIF                  | `compress/photo.ts`                       |
| Video out      | Always `.mp4` H.264 + AAC; optional scale by max height                 | `compress/video.ts`                       |
| Replace video  | May change extension; unlink old after successful write                 | `compress/write.ts`                       |
| Alongside name | `name_compressed.ext`                                                   | `presets.compressedSiblingPath`           |
| Min size `0`   | Filter off                                                              | `presets.isBelowMinSize`                  |
| ffmpeg missing | Warn at start; force videos off; photos still work                      | `app.tsx`, `ffmpeg.ts`                    |
| Folder picker  | macOS osascript / Windows WinForms / Linux zenity\|kdialog              | `fs/pick-folder.ts`                       |
| Staging        | Copy to `stageDir` (default OS tmp), encode there, commit to original   | `fs/stage.ts`, `compress/run.ts`          |

## Conventions for changes

1. **Prefer `type` over `interface`** (project rule).
2. Keep **Russian strings** in `i18n/ru.ts` — no hardcoded UI copy in components when avoidable.
3. New wizard step → add component under `wizard/`, wire in `Wizard.tsx`, bump `totalWizardSteps` / titles in `ui/types.ts`.
4. New screen → `screens/` + branch in `app.tsx`.
5. After logic changes affecting utils: add/update tests in `test/*.test.js` importing from **`dist/`** (tests run after `tsc`).
6. Run `npm test` before claiming done (prettier + xo + build + ava).
7. Do not edit plan files under `.cursor/plans/` unless asked.
8. Avoid bloating `app.tsx` — orchestration only; UI in screens/wizard.

## Where to change what

| Goal                          | Touch                                     |
| ----------------------------- | ----------------------------------------- |
| New CLI flag                  | `cli.tsx` + pass into `App`               |
| Default settings              | `defaults.ts`, `presets.ts`               |
| Log format / settings dump    | `log.ts` (`formatSettingsBlock`)          |
| Photo codecs / resize         | `compress/photo.ts`                       |
| Video encode flags / progress | `compress/video.ts`, `ffmpeg-progress.ts` |
| Extensions scanned            | `scan.ts`                                 |
| Worker / queue / staging      | `compress/run.ts`, `fs/stage.ts`          |
| Select keyboard UX            | `components/Select.tsx`                   |

## Out of scope (v1 — do not add unless requested)

- English / i18n switcher
- Bundled ffmpeg binary
- Desktop GUI (Electron/Tauri)
- Full EXIF preservation
- Multiple root folders in one run

## Mental model for agents

User configures once in the wizard → confirm → tool walks the tree and compresses with clear logging. Correctness and “don’t make files bigger” matter more than micro-optimizations. Keep modules small and the FSM in `app.tsx` readable.
