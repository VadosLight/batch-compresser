import process from 'node:process';
import {execa} from 'execa';

export type FfmpegInstallPlan = {
	manager: 'brew' | 'apt-get' | 'dnf' | 'pacman' | 'winget' | 'choco';
	label: string;
	command: string;
	args: string[];
	/** When true, run with stdio inherit so sudo/UAC prompts work. */
	inheritStdio: boolean;
};

export type CommandChecker = (command: string) => Promise<boolean>;

const whichCommand = (): string =>
	process.platform === 'win32' ? 'where' : 'which';

export const defaultHasCommand: CommandChecker = async (
	command: string,
): Promise<boolean> => {
	try {
		await execa(whichCommand(), [command]);
		return true;
	} catch {
		return false;
	}
};

export const detectInstallPlan = async (
	hasCommand: CommandChecker = defaultHasCommand,
	platform: NodeJS.Platform = process.platform,
): Promise<FfmpegInstallPlan | undefined> => {
	if (platform === 'darwin') {
		if (await hasCommand('brew')) {
			return {
				manager: 'brew',
				label: 'Homebrew',
				command: 'brew',
				args: ['install', 'ffmpeg'],
				inheritStdio: false,
			};
		}

		return undefined;
	}

	if (platform === 'linux') {
		if (await hasCommand('apt-get')) {
			return {
				manager: 'apt-get',
				label: 'apt',
				command: 'sudo',
				args: ['apt-get', 'install', '-y', 'ffmpeg'],
				inheritStdio: true,
			};
		}

		if (await hasCommand('dnf')) {
			return {
				manager: 'dnf',
				label: 'dnf',
				command: 'sudo',
				args: ['dnf', 'install', '-y', 'ffmpeg'],
				inheritStdio: true,
			};
		}

		if (await hasCommand('pacman')) {
			return {
				manager: 'pacman',
				label: 'pacman',
				command: 'sudo',
				args: ['pacman', '-S', '--noconfirm', 'ffmpeg'],
				inheritStdio: true,
			};
		}

		return undefined;
	}

	if (platform === 'win32') {
		if (await hasCommand('winget')) {
			return {
				manager: 'winget',
				label: 'winget',
				command: 'winget',
				args: [
					'install',
					'--id',
					'Gyan.FFmpeg',
					'-e',
					'--accept-package-agreements',
					'--accept-source-agreements',
				],
				inheritStdio: true,
			};
		}

		if (await hasCommand('choco')) {
			return {
				manager: 'choco',
				label: 'Chocolatey',
				command: 'choco',
				args: ['install', 'ffmpeg', '-y'],
				inheritStdio: true,
			};
		}

		return undefined;
	}

	return undefined;
};

export const formatInstallCommand = (plan: FfmpegInstallPlan): string =>
	[plan.command, ...plan.args].join(' ');

export type InstallFfmpegResult = {
	ok: boolean;
	errorMessage?: string;
};

export const installFfmpeg = async (
	plan: FfmpegInstallPlan,
): Promise<InstallFfmpegResult> => {
	try {
		await execa(plan.command, plan.args, {
			stdio: plan.inheritStdio ? 'inherit' : 'pipe',
		});
		return {ok: true};
	} catch (error) {
		return {
			ok: false,
			errorMessage: error instanceof Error ? error.message : String(error),
		};
	}
};
