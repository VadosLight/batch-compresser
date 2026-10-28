import test from 'ava';
import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {validateDirectory} from '../dist/core/fs/validate-dir.js';

test('validateDirectory rejects empty', async t => {
	const result = await validateDirectory('   ');
	t.false(result.ok);
	if (!result.ok) {
		t.is(result.reason, 'empty');
	}
});

test('validateDirectory rejects missing', async t => {
	const result = await validateDirectory('/no/such/dir/batch-compresser');
	t.false(result.ok);
	if (!result.ok) {
		t.is(result.reason, 'missing');
	}
});

test('validateDirectory rejects file', async t => {
	const dir = await mkdtemp(path.join(tmpdir(), 'bc-'));
	const file = path.join(dir, 'file.txt');
	await writeFile(file, 'x');
	const result = await validateDirectory(file);
	t.false(result.ok);
	if (!result.ok) {
		t.is(result.reason, 'notDirectory');
	}
});

test('validateDirectory accepts directory', async t => {
	const dir = await mkdtemp(path.join(tmpdir(), 'bc-'));
	const result = await validateDirectory(dir);
	t.true(result.ok);
	if (result.ok) {
		t.is(result.resolved, path.resolve(dir));
	}
});
