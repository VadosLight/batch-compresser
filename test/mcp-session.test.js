import test from 'ava';
import {McpSession} from '../dist/mcp/session.js';
import {createMcpServer} from '../dist/mcp/server.js';

const createFakePorts = (overrides = {}) => {
	const ffmpeg = {
		check: async () => ({available: true, versionLine: 'ffmpeg version test'}),
		probeVideo: async () => ({width: 0, height: 0}),
		listFormatsText: async () => '',
		...overrides.ffmpeg,
	};
	const fs = {
		validateDirectory: async input => {
			const trimmed = String(input).trim();
			if (!trimmed) {
				return {ok: false, reason: 'empty'};
			}

			return {ok: true, resolved: trimmed};
		},
		pickFolder: async () => ({ok: false, cancelled: true}),
		pickFile: async () => ({ok: false, cancelled: true}),
		openContainingFolder: async () => {},
		...overrides.fs,
	};
	const process = {
		detectInstallPlan: async () => undefined,
		installFfmpeg: async () => ({ok: false, errorMessage: 'not_run'}),
		...overrides.process,
	};

	return {ffmpeg, fs, process};
};

test('boot then configure sets rootDir', async t => {
	const session = new McpSession({ports: createFakePorts()});
	await session.boot();
	t.is(session.getViewModel().screen, 'wizard');
	const vm = await session.configure({
		rootDir: '/tmp/media',
		processVideos: false,
	});
	t.is(vm.settings.rootDir, '/tmp/media');
	t.false(vm.settings.processVideos);
});

test('start_compression rejects when not on confirm', t => {
	const session = new McpSession({ports: createFakePorts()});
	t.throws(() => session.startCompression(), {
		message: /cannot_start_from_screen_/,
	});
});

test('createMcpServer registers core tools', t => {
	const session = new McpSession({ports: createFakePorts()});
	const server = createMcpServer(session);
	t.truthy(server);
});
