# Interactive video skip during compression

## Goal

While videos are being compressed, the user can focus one active video job, confirm a skip, abort that encode, keep the original file, clean temporary/staging artifacts, log `SKIP_USER`, and continue the queue. Paths logged as `SKIP_USER` are treated as already handled when resuming from previous logs.

## Non-goals

- Pre-run checklist / multi-select before start
- Skipping photos
- Pausing the whole batch
- Changing video encode settings mid-run

## UX

**Screen:** `RunningScreen` only, while there is at least one active **video** job.

| Key | Action |
| --- | --- |
| ↑ / ↓ | Move focus among currently active video jobs |
| `s` | Open confirm for the focused video |
| Enter | Confirm skip → abort that job |
| Esc | Cancel confirm (encode continues) |

- Focus indicator on the focused job row (e.g. `>` or highlight).
- Confirm line: short Russian prompt with basename, e.g. `Пропустить video.mp4? Enter — да · Esc — нет`.
- Hint when videos are active: `↑↓ выбор · s пропуск`.
- If no active videos, `s` is a no-op.
- If the focused job finishes, focus moves to the next remaining active video (or clears).
- Photo jobs appear in the list but are not focusable for skip (or are skipped when cycling focus).

## Behavior on confirmed skip

1. Abort the focused job’s `AbortController`.
2. Kill the running `ffmpeg` subprocess for that job (via execa cancel / AbortSignal).
3. Delete encode temp file and any staged copy for that job; do **not** modify the original media file.
4. Record result: `status: 'skip_user'`, `bytesBefore` = original size, `bytesAfter` = same.
5. Log line: `SKIP_USER | video | <path> | before=… | after=…`
6. Increment `done`, update savings totals like other non-ok finishes (no size change).
7. Free the worker slot so the next queued video can start.

Abort may happen during `probe`, `stage`, or `encode`. Cleanup must run in all cases (tmp + staged input).

## Architecture

### Pipeline (`compress/run.ts`)

- Maintain `Map<string, AbortController>` keyed by source path for in-flight video jobs.
- When starting a video `handleOne`, create controller, register it, pass `signal` into `compressVideo`.
- On settle (ok / error / skip_user), delete from the map.
- Expose a skip handle to the UI, e.g. `skipVideo(path: string): void` that calls `controllers.get(path)?.abort()`.
- `runCompression` return / progress API extended so App can pass the skip function into `RunningScreen` (e.g. progress callback also receives a stable `controls` object, or `runCompression` accepts `{ onProgress, getControls }` / returns controls synchronously via a ref-style callback `onReady(controls)`).

Recommended wiring:

```ts
type RunControls = {
  skipVideo: (path: string) => void;
};

runCompression(settings, {
  onProgress,
  onControls: (controls: RunControls) => void,
});
```

`onControls` called once at start (or whenever the controller map API is ready) so React state can hold `skipVideo`.

### Video encode (`compress/video.ts`)

- Accept optional `signal?: AbortSignal` in options.
- Pass to `execa('ffmpeg', args, { cancelSignal: signal })` (execa 8).
- On abort / cancellation: unlink temp output if present; rethrow or return structured `skip_user` so `run.ts` does not treat it as a generic error.
- Distinguish user abort from real failures (check `signal.aborted` / execa cancel error).

### Staging

- Existing `cleanupStagedFile` / `onEncoded` path must still run on skip (use `finally` or abort branch calling the same cleanup).

### Types / log / resume

- Add `FileStatus` value `'skip_user'`.
- `previousDoneStatuses` / log parse regex: include `SKIP_USER` alongside `OK`, `SKIP_LARGER`, `SKIP_LOW_GAIN`.
- Resume via existing `previousLogsPath` → `skip_previous` for those paths.
- `RunSummary`: optional `skipUser` count for summary/log footer (nice-to-have; v1 may omit UI line if time-boxed, but log line is required). Prefer including `skipUser` in summary + Russian string for consistency.

### UI (`RunningScreen` + `app.tsx`)

- State: `focusedPath` (or index), `confirmSkip: boolean`.
- `useInput` only when `screen === 'running'`.
- Call `controls.skipVideo(focusedPath)` only after Enter in confirm mode.
- Do not steal Esc from other screens; only handle Esc while `confirmSkip`.

## Testing

- Unit: previous-logs parser accepts `SKIP_USER` paths.
- Unit: abort / cancel path maps to `skip_user` (mock execa or small helper that classifies cancel errors).
- Unit: `orderVideos` / controls registration not required beyond skip map behavior if hard to integration-test Ink.

## Files to touch

| File | Change |
| ---- | ------ |
| `source/types.ts` | `skip_user` status; summary field if added |
| `source/compress/video.ts` | `cancelSignal`, abort → skip |
| `source/compress/run.ts` | AbortControllers, controls, cleanup on skip |
| `source/fs/previous-logs.ts` | Parse `SKIP_USER` |
| `source/log.ts` | Summary line for skip_user if counted |
| `source/screens/RunningScreen.tsx` | Focus, confirm, keys |
| `source/screens/SummaryScreen.tsx` | Optional skip_user line |
| `source/app.tsx` | Wire controls + input ownership |
| `source/i18n/ru.ts` | Prompts / hints / summary |
| `test/previous-logs.test.js` | SKIP_USER case |
| `AGENTS.md` | Short note on interactive skip + resume |

## Success criteria

- User can skip one active video at a time with confirmation without stopping the batch.
- Original file unchanged; temps/staging removed.
- New run with previous logs path skips `SKIP_USER` paths.
- Photos and unfocused videos unaffected.
