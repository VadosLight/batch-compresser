import test from 'ava';
import {SessionPresenter} from '../dist/core/app/SessionPresenter.js';

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

test('start with ffmpeg available goes to wizard', async t => {
	const presenter = new SessionPresenter({
		ports: createFakePorts(),
		initialPath: '/tmp/media',
	});
	await presenter.start();
	const vm = presenter.getViewModel();
	t.is(vm.screen, 'wizard');
	t.true(vm.ffmpeg.available);
	t.is(vm.settings.rootDir, '/tmp/media');
});

test('start without ffmpeg goes to warn and disables videos', async t => {
	const plan = {
		manager: 'brew',
		label: 'Homebrew',
		command: 'brew',
		args: ['install', 'ffmpeg'],
		inheritStdio: true,
	};
	const presenter = new SessionPresenter({
		ports: createFakePorts({
			ffmpeg: {
				check: async () => ({available: false, error: 'missing'}),
				probeVideo: async () => ({width: 0, height: 0}),
				listFormatsText: async () => '',
			},
			process: {
				detectInstallPlan: async () => plan,
				installFfmpeg: async () => ({ok: false}),
			},
		}),
	});
	await presenter.start();
	const vm = presenter.getViewModel();
	t.is(vm.screen, 'ffmpegWarn');
	t.false(vm.ffmpeg.available);
	t.false(vm.settings.processVideos);
	t.deepEqual(vm.ffmpeg.installPlan, plan);
});

test('continuePhotosOnly enters wizard without videos', async t => {
	const presenter = new SessionPresenter({
		ports: createFakePorts({
			ffmpeg: {
				check: async () => ({available: false}),
				probeVideo: async () => ({width: 0, height: 0}),
				listFormatsText: async () => '',
			},
		}),
	});
	await presenter.start();
	presenter.continuePhotosOnly();
	const vm = presenter.getViewModel();
	t.is(vm.screen, 'wizard');
	t.false(vm.settings.processVideos);
});

test('installFfmpeg success enables videos and wizard', async t => {
	let available = false;
	const plan = {
		manager: 'brew',
		label: 'Homebrew',
		command: 'brew',
		args: ['install', 'ffmpeg'],
		inheritStdio: true,
	};
	const presenter = new SessionPresenter({
		ports: createFakePorts({
			ffmpeg: {
				check: async () =>
					available
						? {available: true, versionLine: 'ffmpeg version 6'}
						: {available: false},
				probeVideo: async () => ({width: 0, height: 0}),
				listFormatsText: async () => '',
			},
			process: {
				detectInstallPlan: async () => plan,
				installFfmpeg: async () => {
					available = true;
					return {ok: true};
				},
			},
		}),
	});
	await presenter.start();
	t.is(presenter.getViewModel().screen, 'ffmpegWarn');
	await presenter.installFfmpeg();
	const vm = presenter.getViewModel();
	t.is(vm.screen, 'wizard');
	t.true(vm.ffmpeg.available);
	t.true(vm.settings.processVideos);
});

test('finishWizard without path sets path_empty', async t => {
	const presenter = new SessionPresenter({ports: createFakePorts()});
	await presenter.start();
	await presenter.finishWizard();
	const vm = presenter.getViewModel();
	t.is(vm.error, 'path_empty');
	t.is(vm.wizardStep, 1);
	t.is(vm.screen, 'wizard');
});

test('subscribe emits current VM and patches', async t => {
	const presenter = new SessionPresenter({ports: createFakePorts()});
	const screens = [];
	const unsubscribe = presenter.subscribe(vm => {
		screens.push(vm.screen);
	});
	await presenter.start();
	unsubscribe();
	t.is(screens[0], 'boot');
	t.true(screens.includes('wizard'));
});

test('validateAndSetRootDir updates settings', async t => {
	const presenter = new SessionPresenter({ports: createFakePorts()});
	const ok = await presenter.validateAndSetRootDir('/tmp/photos');
	t.true(ok);
	t.is(presenter.getViewModel().settings.rootDir, '/tmp/photos');
});

test('patchSettings and wizardNext advance step', async t => {
	const presenter = new SessionPresenter({
		ports: createFakePorts(),
		initialPath: '/tmp/media',
	});
	await presenter.start();
	presenter.patchSettings({processPhotos: true, processVideos: false});
	presenter.wizardNext();
	t.is(presenter.getViewModel().wizardStep, 2);
});
