# Interactive Video Skip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** During compression, let the user focus an active video job, confirm skip, abort ffmpeg, keep the original, clean temps/staging, log `SKIP_USER`, and resume-skip those paths from previous logs.

**Architecture:** Per-video `AbortController` in `runCompression`; UI calls `skipVideo(path)` after confirm; `compressVideo` passes `signal` to execa 8 and maps cancel → `skip_user`; `previous-logs` treats `SKIP_USER` like other done statuses.

**Tech Stack:** Node ESM, TypeScript, Ink 4 + React 18, execa 8 (`signal: AbortSignal`), ava tests against `dist/`.

**Spec:** `docs/superpowers/specs/2026-10-26-interactive-video-skip-design.md`

## Global Constraints

- UI copy in Russian via `source/i18n/ru.ts` only.
- Prefer `type` over `interface`.
- execa **8** uses option name **`signal`** (not `cancelSignal`).
- Skip applies to **videos only**; photos unchanged.
- Original media file must never be deleted/modified on skip.
- Tests: `npm test` (prettier + xo + `tsc` + ava); unit tests import from `dist/`.
- Do not reintroduce npm `ffmpeg` package.

---

### Task 1: Types + previous-logs resume for SKIP_USER

**Files:**

- Modify: `source/types.ts`
- Modify: `source/fs/previous-logs.ts`
- Modify: `test/previous-logs.test.js`
- Modify: `source/log.ts` (summary field wiring prepared in Task 4; types only here if needed)

**Interfaces:**

- Produces: `FileStatus` includes `'skip_user'`; `RunSummary.skipUser: number`; parser accepts `SKIP_USER` lines

- [ ] **Step 1: Extend failing tests for SKIP_USER resume**

In `test/previous-logs.test.js`, update/add:

```js
test('previousDoneStatuses includes handled outcomes', t => {
	t.true(previousDoneStatuses.has('OK'));
	t.true(previousDoneStatuses.has('SKIP_LARGER'));
	t.true(previousDoneStatuses.has('SKIP_LOW_GAIN'));
	t.true(previousDoneStatuses.has('SKIP_USER'));
	t.false(previousDoneStatuses.has('SKIP_SMALL'));
	t.false(previousDoneStatuses.has('ERROR'));
});

test('parseProcessedPathsFromLogText includes SKIP_USER', t => {
	const sample = `
SKIP_USER | video | /tmp/album/skipped.mp4 | before=9000 (8.8 КБ) | after=9000 (8.8 КБ)
OK | photo | /tmp/album/a.jpg | before=1000 (1.0 КБ) | after=400 (400 Б)
`;
	const paths = parseProcessedPathsFromLogText(sample);
	t.true(paths.has(path.resolve('/tmp/album/skipped.mp4')));
	t.true(paths.has(path.resolve('/tmp/album/a.jpg')));
	t.is(paths.size, 2);
});
```

Also keep the existing sample test; add one `SKIP_USER` line there and bump expected size / assert that path is included (adjust `t.is(paths.size, …)` accordingly).

- [ ] **Step 2: Run tests to verify fail**

Run: `npm run build && npx ava test/previous-logs.test.js`

Expected: FAIL — `SKIP_USER` not in set / not parsed.

- [ ] **Step 3: Implement types + parser**

`source/types.ts` — add to `FileStatus`:

```ts
| 'skip_user'
```

Add to `RunSummary`:

```ts
skipUser: number;
```

Update JSDoc on `previousLogsPath` to mention `SKIP_USER`.

`source/fs/previous-logs.ts`:

```ts
export const previousDoneStatuses = new Set([
	'OK',
	'SKIP_LARGER',
	'SKIP_LOW_GAIN',
	'SKIP_USER',
]);

const logLinePattern =
	/^(ok|skip_larger|skip_low_gain|skip_user)\s*\|\s*(?:photo|video)\s*\|\s*(.+?)\s*\|\s*before=/i;
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run build && npx ava test/previous-logs.test.js`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add source/types.ts source/fs/previous-logs.ts test/previous-logs.test.js
git commit -m "$(cat <<'EOF'
Recognize SKIP_USER in previous-log resume parsing.

EOF
)"
```

---

### Task 2: Classify cancel errors + compressVideo abort → skip_user

**Files:**

- Create: `source/compress/abort.ts`
- Modify: `source/compress/video.ts`
- Create: `test/abort.test.js`

**Interfaces:**

- Consumes: `FileStatus` / `FileResult` from types
- Produces:

  - `isCancelError(error: unknown, signal?: AbortSignal): boolean`
  - `CompressVideoOptions.signal?: AbortSignal`
  - `compressVideo(...)` returns `{ status: 'skip_user', ... }` when aborted

- [ ] **Step 1: Write failing unit tests for cancel detection**

Create `test/abort.test.js`:

```js
import test from 'ava';
import {isCancelError} from '../dist/compress/abort.js';

test('isCancelError true when signal aborted', t => {
	const c = new AbortController();
	c.abort();
	t.true(isCancelError(new Error('x'), c.signal));
});

test('isCancelError true when error.isCanceled', t => {
	t.true(isCancelError({isCanceled: true, message: 'canceled'}));
});

test('isCancelError false for normal errors', t => {
	t.false(isCancelError(new Error('ffmpeg failed')));
	t.false(isCancelError({isCanceled: false}));
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm run build && npx ava test/abort.test.js`

Expected: FAIL — module missing.

- [ ] **Step 3: Implement `source/compress/abort.ts`**

```ts
export const isCancelError = (
	error: unknown,
	signal?: AbortSignal,
): boolean => {
	if (signal?.aborted) {
		return true;
	}

	if (error && typeof error === 'object' && 'isCanceled' in error) {
		return Boolean((error as {isCanceled?: boolean}).isCanceled);
	}

	return false;
};
```

- [ ] **Step 4: Wire `compressVideo` to honour `signal`**

In `CompressVideoOptions` add:

```ts
signal?: AbortSignal;
```

At start of try (and after probe, before encode):

```ts
if (options.signal?.aborted) {
	throw Object.assign(new Error('aborted'), {isCanceled: true});
}
```

Change ffmpeg spawn to:

```ts
const subprocess = execa('ffmpeg', args, {
	signal: options.signal,
});
```

In `catch`:

```ts
if (tmp) {
	await rm(tmp, {force: true}).catch(() => undefined);
}

if (isCancelError(error, options.signal)) {
	return {
		path: commitPath,
		kind: 'video',
		status: 'skip_user',
		bytesBefore: 0,
		bytesAfter: 0,
	};
}

// existing error return...
```

Import `isCancelError` from `./abort.js`.

- [ ] **Step 5: Run abort tests + build**

Run: `npm run build && npx ava test/abort.test.js`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add source/compress/abort.ts source/compress/video.ts test/abort.test.js
git commit -m "$(cat <<'EOF'
Abort ffmpeg via AbortSignal and map cancel to skip_user.

EOF
)"
```

---

### Task 3: runCompression AbortControllers + RunControls

**Files:**

- Modify: `source/compress/run.ts`
- Modify: `source/app.tsx` (signature only if needed in Task 5; prefer finishing API here)

**Interfaces:**

- Produces:

```ts
export type RunControls = {
	skipVideo: (path: string) => void;
};

export type RunCompressionHandlers = {
	onProgress?: (event: ProgressEvent) => void;
	onControls?: (controls: RunControls) => void;
};

export const runCompression = async (
	settings: CompressSettings,
	handlers?: RunCompressionHandlers | ((event: ProgressEvent) => void),
): Promise<RunSummary>;
```

Keep backward compatibility: if second arg is a function, treat as `onProgress` only.

- Consumes: `compressVideo` with `signal`; `isCancelError` optional at run layer for stage/probe aborts

- [ ] **Step 1: Change `runCompression` signature and register controllers**

Normalize handlers:

```ts
const onProgress =
	typeof handlers === 'function' ? handlers : handlers?.onProgress;
const onControls =
	typeof handlers === 'function' ? undefined : handlers?.onControls;
```

After creating logger / before processing:

```ts
const videoAbortControllers = new Map<string, AbortController>();

const skipVideo = (path: string): void => {
	videoAbortControllers.get(path)?.abort();
};

onControls?.({skipVideo});
```

Ensure video list uses small-first ordering (restore if missing):

```ts
const videos = orderVideosForProcessing(
	scan.toProcess.filter(f => f.kind === 'video'),
	settings.videosSmallFirst,
);
```

- [ ] **Step 2: In `handleOne` for videos — create controller, pass signal, cleanup on settle**

At start of video branch (before stage):

```ts
const controller = new AbortController();
videoAbortControllers.set(file.path, controller);
const {signal} = controller;
```

Before stage / after stage, if `signal.aborted`, return skip_user result with `file.sizeBytes` (and cleanup staged).

Pass to `compressVideo`:

```ts
{
	commitPath,
	onEncoded: releaseStagedInput,
	signal,
}
```

In `finally` of handleOne (or both success and catch paths):

```ts
videoAbortControllers.delete(file.path);
await cleanupStagedFile(workPath, commitPath);
```

When `result.status === 'skip_user'`, ensure `bytesBefore`/`bytesAfter` filled from `file.sizeBytes` if still 0 (same block that fixes zero sizes).

Do **not** treat `skip_user` as `error` in the outer catch — `compressVideo` already returns FileResult.

If `stageFile` throws after abort, map to skip_user when `signal.aborted`.

- [ ] **Step 3: Manual sanity — typecheck**

Run: `npm run build`

Expected: SUCCESS (app may still pass function form of onProgress).

- [ ] **Step 4: Commit**

```bash
git add source/compress/run.ts
git commit -m "$(cat <<'EOF'
Add per-video AbortController and skipVideo run controls.

EOF
)"
```

---

### Task 4: Summary counts for skip_user

**Files:**

- Modify: `source/log.ts`
- Modify: `source/screens/SummaryScreen.tsx`
- Modify: `source/i18n/ru.ts`
- Modify: `test/presets.test.js` (buildSummary call / assertions)

**Interfaces:**

- Consumes: `RunSummary.skipUser`
- Produces: log footer + UI line `Пропущено (пользователь): N`

- [ ] **Step 1: Update `buildSummary` to count `skip_user`**

In the results loop:

```ts
let skipUser = 0;
// ...
} else if (r.status === 'skip_user') {
	skipUser++;
	bytesAfter += r.bytesBefore;
}
```

Return `skipUser` on the summary object.

In `writeSummary` block add after skipPrevious (or near other skips):

```ts
`Пропущено (пользователь): ${summary.skipUser}`,
```

- [ ] **Step 2: i18n + SummaryScreen**

`source/i18n/ru.ts`:

```ts
skipUser: (n: number) => `Пропущено (пользователь): ${n}`,
```

`SummaryScreen.tsx` — render `<Text>{ru.skipUser(summary.skipUser)}</Text>` near other skip lines.

- [ ] **Step 3: Fix `test/presets.test.js` buildSummary expectations**

Ensure returned summary includes `skipUser: 0` (or add a skip_user fixture row and assert count).

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: all pass (RunningScreen not wired yet — OK).

- [ ] **Step 5: Commit**

```bash
git add source/log.ts source/screens/SummaryScreen.tsx source/i18n/ru.ts test/presets.test.js
git commit -m "$(cat <<'EOF'
Count and display user-skipped videos in the summary.

EOF
)"
```

---

### Task 5: RunningScreen focus + confirm + App wiring

**Files:**

- Modify: `source/screens/RunningScreen.tsx`
- Modify: `source/app.tsx`
- Modify: `source/i18n/ru.ts`

**Interfaces:**

- Consumes: `RunControls.skipVideo`
- Produces: interactive skip UX on running screen

- [ ] **Step 1: Add Russian strings**

```ts
skipHint: '↑↓ выбор · s пропуск',
skipConfirm: (name: string) =>
	`Пропустить ${name}? Enter — да · Esc — нет`,
```

- [ ] **Step 2: Implement RunningScreen interaction**

Props add:

```ts
onSkipVideo?: (path: string) => void;
```

Internal state:

```ts
const [focusedPath, setFocusedPath] = useState<string>();
const [confirmSkip, setConfirmSkip] = useState(false);
```

Derive `videoJobs = jobs.filter(j => j.kind === 'video')`.

`useEffect` to keep focus valid:

- If `focusedPath` not in `videoJobs`, set to `videoJobs[0]?.path`.
- If confirm open and focus lost, clear confirm.

`useInput((input, key) => { ... })`:

- If `confirmSkip`: Enter → `onSkipVideo?.(focusedPath)` then clear confirm; Esc → clear confirm; ignore other keys.
- Else if videoJobs length > 0:
  - upArrow / downArrow: move focus within `videoJobs`
  - `input === 's' || input === 'S'`: set `confirmSkip` true if `focusedPath` set

Render:

- Hint line when `videoJobs.length > 0`: `ru.skipHint`
- Confirm line when `confirmSkip && focusedPath`: `ru.skipConfirm(basename)`
- Focus marker on focused row, e.g. `>` prefix or `color="yellow"`

- [ ] **Step 3: Wire App**

```ts
const [skipVideo, setSkipVideo] = useState<(path: string) => void>();

// in startRun:
await runCompression(settings, {
	onControls: controls => {
		setSkipVideo(() => controls.skipVideo);
	},
	onProgress: event => {
		/* existing setProgress */
	},
});
```

Pass to RunningScreen:

```tsx
onSkipVideo={path => {
	skipVideo?.(path);
}}
```

Clear `skipVideo` when leaving running screen / starting new run.

- [ ] **Step 4: Run full suite**

Run: `npm test`

Expected: PASS (prettier, xo, tsc, ava).

- [ ] **Step 5: Commit**

```bash
git add source/screens/RunningScreen.tsx source/app.tsx source/i18n/ru.ts
git commit -m "$(cat <<'EOF'
Add interactive video skip with confirm on the running screen.

EOF
)"
```

---

### Task 6: Docs

**Files:**

- Modify: `AGENTS.md`
- Modify: `readme.md` (one bullet under capabilities)

- [ ] **Step 1: Document behavior**

AGENTS.md — Key domain rules / Progress:

- Interactive skip: ↑↓ focus active video, `s` + Enter confirms; AbortSignal kills ffmpeg; status `skip_user` / log `SKIP_USER`; resume via previous logs.

readme.md — bullet:

- Во время сжатия видео: ↑↓ выбрать задачу, `s` + Enter — пропустить (оригинал сохраняется; в логах `SKIP_USER`, учитывается при resume)

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md readme.md
git commit -m "$(cat <<'EOF'
Document interactive video skip and SKIP_USER resume.

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement                 | Task                        |
| -------------------------------- | --------------------------- |
| Focus active video with ↑↓       | Task 5                      |
| `s` + Enter/Esc confirm          | Task 5                      |
| Abort ffmpeg via AbortSignal     | Tasks 2–3                   |
| Keep original; clean tmp/staging | Tasks 2–3                   |
| Log `SKIP_USER`                  | Tasks 1–3 (status → logger) |
| Resume parses SKIP_USER          | Task 1                      |
| Summary skip_user                | Task 4                      |
| Photos unaffected                | Tasks 3, 5                  |
| Russian strings                  | Tasks 4–5                   |
| AGENTS/readme                    | Task 6                      |

## Notes for implementers

- execa 8: `{ signal: abortController.signal }`, then `error.isCanceled === true`.
- Prefer returning `skip_user` from `compressVideo` over throwing, so `run.ts` logging stays uniform.
- `onControls` must be invoked **before** video workers start so UI can skip early-stage jobs.
- Do not handle Esc globally in App while confirm is open — keep Esc handling inside RunningScreen when `confirmSkip`.
