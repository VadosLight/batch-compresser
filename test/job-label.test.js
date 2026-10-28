import test from 'ava';
import {formatJobLabel} from '../dist/tui/ui/job-label.js';

test('formatJobLabel uses parent and basename', t => {
	t.is(formatJobLabel('/Users/me/Отпуск/IMG_001.mp4'), 'Отпуск/IMG_001.mp4');
	t.is(formatJobLabel('/a/b/c/clip.mov'), 'c/clip.mov');
});

test('formatJobLabel falls back to basename at root-ish paths', t => {
	t.is(formatJobLabel('/file.mp4'), 'file.mp4');
	t.is(formatJobLabel('file.mp4'), 'file.mp4');
});
