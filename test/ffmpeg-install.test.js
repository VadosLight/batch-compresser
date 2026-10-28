import test from 'ava';
import {
	detectInstallPlan,
	formatInstallCommand,
} from '../dist/ffmpeg-install.js';

const has =
	(...names) =>
	async command =>
		names.includes(command);

test('detectInstallPlan prefers brew on macOS', async t => {
	const plan = await detectInstallPlan(has('brew'), 'darwin');
	t.truthy(plan);
	t.is(plan.manager, 'brew');
	t.is(formatInstallCommand(plan), 'brew install ffmpeg');
});

test('detectInstallPlan returns undefined without brew on macOS', async t => {
	t.is(await detectInstallPlan(has(), 'darwin'), undefined);
});

test('detectInstallPlan prefers apt-get on linux', async t => {
	const plan = await detectInstallPlan(has('apt-get', 'dnf'), 'linux');
	t.is(plan?.manager, 'apt-get');
	t.true(plan?.inheritStdio);
	t.is(formatInstallCommand(plan), 'sudo apt-get install -y ffmpeg');
});

test('detectInstallPlan falls back to dnf then pacman', async t => {
	t.is((await detectInstallPlan(has('dnf'), 'linux'))?.manager, 'dnf');
	t.is((await detectInstallPlan(has('pacman'), 'linux'))?.manager, 'pacman');
});

test('detectInstallPlan prefers winget on windows', async t => {
	const plan = await detectInstallPlan(has('winget', 'choco'), 'win32');
	t.is(plan?.manager, 'winget');
	t.true(formatInstallCommand(plan).includes('Gyan.FFmpeg'));
});

test('detectInstallPlan falls back to choco on windows', async t => {
	const plan = await detectInstallPlan(has('choco'), 'win32');
	t.is(plan?.manager, 'choco');
	t.is(formatInstallCommand(plan), 'choco install ffmpeg -y');
});
