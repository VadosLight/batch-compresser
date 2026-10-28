import path from 'node:path';
import test from 'ava';
import {
	parseProcessedPathsFromLogText,
	previousDoneStatuses,
} from '../dist/core/fs/previous-logs.js';

test('previousDoneStatuses includes handled outcomes', t => {
	t.true(previousDoneStatuses.has('OK'));
	t.true(previousDoneStatuses.has('SKIP_LARGER'));
	t.true(previousDoneStatuses.has('SKIP_LOW_GAIN'));
	t.true(previousDoneStatuses.has('SKIP_USER'));
	t.false(previousDoneStatuses.has('SKIP_SMALL'));
	t.false(previousDoneStatuses.has('ERROR'));
});

test('parseProcessedPathsFromLogText extracts resolved paths', t => {
	const sample = `
Batch Compressor log
=== ФАЙЛЫ ===
OK | photo | /tmp/album/a.jpg | before=1000 (1.0 КБ) | after=400 (400 Б)
SKIP_LARGER | video | /tmp/album/b.mp4 | before=2000 (2.0 КБ) | after=2000 (2.0 КБ)
SKIP_LOW_GAIN | video | /tmp/album/c.mov | before=3000 (2.9 КБ) | after=3000 (2.9 КБ)
SKIP_USER | video | /tmp/album/skipped.mp4 | before=9000 (8.8 КБ) | after=9000 (8.8 КБ)
SKIP_SMALL | photo | /tmp/album/tiny.jpg | before=10 (10 Б) | after=10 (10 Б)
SKIP_COMPRESSED | photo | /tmp/album/x_compressed.jpg | before=50 (50 Б) | after=50 (50 Б)
ERROR | photo | /tmp/album/bad.jpg | before=80 (80 Б) | after=80 (80 Б) | error=boom
SKIP_PREVIOUS | photo | /tmp/album/old.jpg | before=90 (90 Б) | after=90 (90 Б)
`;

	const paths = parseProcessedPathsFromLogText(sample);
	t.true(paths.has(path.resolve('/tmp/album/a.jpg')));
	t.true(paths.has(path.resolve('/tmp/album/b.mp4')));
	t.true(paths.has(path.resolve('/tmp/album/c.mov')));
	t.true(paths.has(path.resolve('/tmp/album/skipped.mp4')));
	t.false(paths.has(path.resolve('/tmp/album/tiny.jpg')));
	t.false(paths.has(path.resolve('/tmp/album/x_compressed.jpg')));
	t.false(paths.has(path.resolve('/tmp/album/bad.jpg')));
	t.false(paths.has(path.resolve('/tmp/album/old.jpg')));
	t.is(paths.size, 4);
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
