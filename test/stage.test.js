import test from 'ava';
import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {
	cleanupStagedFile,
	cleanupStageSession,
	createStageSession,
	stageFile,
} from '../dist/fs/stage.js';
import {moveFile} from '../dist/compress/write.js';
import {access} from 'node:fs/promises';

test('stageFile copies content into session dir', async t => {
	const root = await mkdtemp(path.join(tmpdir(), 'bc-stage-'));
	const session = await createStageSession(root);
	const source = path.join(root, 'clip.mp4');
	await writeFile(source, 'video-bytes');
	const staged = await stageFile(source, session);
	t.not(staged, source);
	t.true(staged.startsWith(session));
	t.is(await readFile(staged, 'utf8'), 'video-bytes');
	await cleanupStageSession(session);
});

test('cleanupStagedFile removes copy but not original', async t => {
	const root = await mkdtemp(path.join(tmpdir(), 'bc-stage-'));
	const session = await createStageSession(root);
	const source = path.join(root, 'clip.mp4');
	await writeFile(source, 'video-bytes');
	const staged = await stageFile(source, session);
	await cleanupStagedFile(staged, source);
	await t.throwsAsync(access(staged));
	t.is(await readFile(source, 'utf8'), 'video-bytes');
	await cleanupStagedFile(source, source);
	t.is(await readFile(source, 'utf8'), 'video-bytes');
	await cleanupStageSession(session);
});

test('moveFile copies when rename would cross devices is still ok same device', async t => {
	const dir = await mkdtemp(path.join(tmpdir(), 'bc-move-'));
	const from = path.join(dir, 'a.bin');
	const to = path.join(dir, 'b.bin');
	await writeFile(from, 'payload');
	await moveFile(from, to);
	t.is(await readFile(to, 'utf8'), 'payload');
});
