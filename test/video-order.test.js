import test from 'ava';
import {orderVideosForProcessing} from '../dist/compress/run.js';

test('orderVideosForProcessing sorts ascending when enabled', t => {
	const input = [
		{path: '/b.mp4', kind: 'video', sizeBytes: 300},
		{path: '/a.mp4', kind: 'video', sizeBytes: 100},
		{path: '/c.mp4', kind: 'video', sizeBytes: 200},
	];
	const ordered = orderVideosForProcessing(input, true);
	t.deepEqual(
		ordered.map(v => v.path),
		['/a.mp4', '/c.mp4', '/b.mp4'],
	);
	t.is(input[0].path, '/b.mp4');
});

test('orderVideosForProcessing keeps order when disabled', t => {
	const input = [
		{path: '/b.mp4', kind: 'video', sizeBytes: 300},
		{path: '/a.mp4', kind: 'video', sizeBytes: 100},
	];
	t.deepEqual(orderVideosForProcessing(input, false), input);
});
