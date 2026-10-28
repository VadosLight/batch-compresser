import test from 'ava';
import {
	openCommandForPlatform,
	openContainingFolder,
} from '../dist/fs/open-path.js';

test('openCommandForPlatform macOS', t => {
	t.deepEqual(openCommandForPlatform('/a/b', 'darwin'), {
		command: 'open',
		args: ['/a/b'],
	});
});

test('openCommandForPlatform windows', t => {
	t.deepEqual(openCommandForPlatform('C:\\a\\b', 'win32'), {
		command: 'explorer',
		args: ['C:\\a\\b'],
	});
});

test('openCommandForPlatform linux', t => {
	t.deepEqual(openCommandForPlatform('/a/b', 'linux'), {
		command: 'xdg-open',
		args: ['/a/b'],
	});
});

test('openContainingFolder opens dirname', async t => {
	const calls = [];
	await openContainingFolder(
		'/movies/trip/clip.mp4',
		async (command, args) => {
			calls.push({command, args});
		},
		'darwin',
	);
	t.deepEqual(calls, [{command: 'open', args: ['/movies/trip']}]);
});
