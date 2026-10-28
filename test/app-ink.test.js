import {EventEmitter} from 'node:events';
import React from 'react';
import test from 'ava';
import {render as inkRender} from 'ink';
import {SessionPresenter} from '../dist/core/app/SessionPresenter.js';
import App from '../dist/tui/App.js';
import BootScreen from '../dist/tui/screens/BootScreen.js';
import FfmpegWarnScreen from '../dist/tui/screens/FfmpegWarnScreen.js';

const delay = ms =>
	new Promise(resolve => {
		setTimeout(resolve, ms);
	});

class TestStdout extends EventEmitter {
	constructor() {
		super();
		this.frames = [];
		this.columns = 120;
		this.rows = 40;
	}

	write(chunk) {
		this.frames.push(String(chunk));
		return true;
	}

	lastFrame() {
		return this.frames.at(-1) ?? '';
	}
}

class TestStdin extends EventEmitter {
	constructor() {
		super();
		this.isTTY = true;
		this.chunks = [];
	}

	setEncoding() {}

	setRawMode() {}

	resume() {}

	pause() {}

	ref() {}

	unref() {}

	pushKey(data) {
		this.chunks.push(Buffer.from(String(data)));
		this.emit('readable');
	}

	read() {
		return this.chunks.shift() ?? null;
	}
}

const renderApp = tree => {
	const stdout = new TestStdout();
	const stdin = new TestStdin();
	const instance = inkRender(tree, {
		stdout,
		stdin,
		debug: true,
		exitOnCtrlC: false,
		patchConsole: false,
	});

	return {
		stdin,
		lastFrame: () => stdout.lastFrame(),
		unmount: () => {
			instance.unmount();
		},
	};
};

const createFakePorts = () => ({
	ffmpeg: {
		check: async () => ({available: true, versionLine: 'ffmpeg version test'}),
		probeVideo: async () => ({width: 0, height: 0}),
		listFormatsText: async () => '',
	},
	fs: {
		validateDirectory: async input => ({
			ok: true,
			resolved: String(input).trim(),
		}),
		pickFolder: async () => ({ok: false, cancelled: true}),
		pickFile: async () => ({ok: false, cancelled: true}),
		openContainingFolder: async () => {},
	},
	process: {
		detectInstallPlan: async () => undefined,
		installFfmpeg: async () => ({ok: false}),
	},
});

const waitForFrame = async (instance, predicate, attempts = 40) => {
	for (let i = 0; i < attempts; i++) {
		const frame = instance.lastFrame() ?? '';
		if (predicate(frame)) {
			return frame;
		}

		await delay(25);
	}

	return instance.lastFrame() ?? '';
};

test('BootScreen renders spinner copy', t => {
	const instance = renderApp(React.createElement(BootScreen));
	t.true(instance.lastFrame().includes('ffmpeg'));
	instance.unmount();
});

test('FfmpegWarnScreen renders missing message', t => {
	const instance = renderApp(React.createElement(FfmpegWarnScreen, {}));
	t.true(instance.lastFrame().includes('ffmpeg'));
	instance.unmount();
});

test('App renders wizard after boot when ffmpeg is available', async t => {
	const presenter = new SessionPresenter({
		ports: createFakePorts(),
		initialPath: '/tmp/media',
	});
	const instance = renderApp(React.createElement(App, {presenter}));
	const frame = await waitForFrame(
		instance,
		text =>
			text.includes('Batch Compresser') &&
			(text.includes('Шаг') || text.includes('Step')),
	);
	t.true(frame.includes('Batch Compresser'));
	t.true(frame.includes('Шаг') || frame.includes('Step'));
	t.is(presenter.getViewModel().screen, 'wizard');
	instance.unmount();
});

test('App Escape on ffmpeg warn continues photos-only via command path', async t => {
	const presenter = new SessionPresenter({
		ports: {
			ffmpeg: {
				check: async () => ({available: false, error: 'missing'}),
				probeVideo: async () => ({width: 0, height: 0}),
				listFormatsText: async () => '',
			},
			fs: createFakePorts().fs,
			process: {
				detectInstallPlan: async () => undefined,
				installFfmpeg: async () => ({ok: false}),
			},
		},
	});
	const instance = renderApp(React.createElement(App, {presenter}));
	await waitForFrame(
		instance,
		text => text.includes('не найден') || text.includes('not found'),
	);
	t.is(presenter.getViewModel().screen, 'ffmpegWarn');

	instance.stdin.pushKey('\u001B');
	await waitForFrame(
		instance,
		() => presenter.getViewModel().screen === 'wizard',
	);

	t.is(presenter.getViewModel().screen, 'wizard');
	t.false(presenter.getViewModel().settings.processVideos);
	instance.unmount();
});
