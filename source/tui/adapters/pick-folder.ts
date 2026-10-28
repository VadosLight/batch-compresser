import {platform} from 'node:os';
import {execa} from 'execa';

export type PickPathResult =
	| {ok: true; path: string}
	| {ok: false; cancelled: boolean; message?: string};

export type PickFolderResult = PickPathResult;

const trimPath = (raw: string): string =>
	raw.trim().replace(/\r/g, '').replace(/\/$/, '') || raw.trim();

const exitCode = (error: unknown): number | undefined =>
	error && typeof error === 'object' && 'exitCode' in error
		? (error as {exitCode?: number}).exitCode
		: undefined;

type PickOptions = {
	prompt?: string;
};

const defaultFolderPrompt = 'Выберите папку для сжатия';
const defaultFilePrompt = 'Выберите файл лога';

const pickMacFolder = async (prompt: string): Promise<PickPathResult> => {
	try {
		const {stdout} = await execa('osascript', [
			'-e',
			'try',
			'-e',
			`POSIX path of (choose folder with prompt ${JSON.stringify(prompt)})`,
			'-e',
			'on error number -128',
			'-e',
			'return ""',
			'-e',
			'end try',
		]);
		const chosen = trimPath(stdout);
		if (!chosen) {
			return {ok: false, cancelled: true};
		}

		return {ok: true, path: chosen};
	} catch (error) {
		return {
			ok: false,
			cancelled: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
};

const pickMacFile = async (prompt: string): Promise<PickPathResult> => {
	try {
		const {stdout} = await execa('osascript', [
			'-e',
			'try',
			'-e',
			`POSIX path of (choose file with prompt ${JSON.stringify(
				prompt,
			)} of type {"log", "public.plain-text", "public.data"})`,
			'-e',
			'on error number -128',
			'-e',
			'return ""',
			'-e',
			'end try',
		]);
		const chosen = trimPath(stdout);
		if (!chosen) {
			return {ok: false, cancelled: true};
		}

		return {ok: true, path: chosen};
	} catch (error) {
		return {
			ok: false,
			cancelled: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
};

const pickLinuxFolder = async (prompt: string): Promise<PickPathResult> => {
	const tryZenity = async (): Promise<PickPathResult | undefined> => {
		try {
			const {stdout} = await execa('zenity', [
				'--file-selection',
				'--directory',
				`--title=${prompt}`,
			]);
			const chosen = trimPath(stdout);
			return chosen ? {ok: true, path: chosen} : {ok: false, cancelled: true};
		} catch (error: unknown) {
			if (exitCode(error) === 1) {
				return {ok: false, cancelled: true};
			}

			return undefined;
		}
	};

	const tryKdialog = async (): Promise<PickPathResult | undefined> => {
		try {
			const {stdout} = await execa('kdialog', [
				'--title',
				prompt,
				'--getexistingdirectory',
				'.',
			]);
			const chosen = trimPath(stdout);
			return chosen ? {ok: true, path: chosen} : {ok: false, cancelled: true};
		} catch (error: unknown) {
			if (exitCode(error) === 1) {
				return {ok: false, cancelled: true};
			}

			return undefined;
		}
	};

	const zenity = await tryZenity();
	if (zenity) {
		return zenity;
	}

	const kdialog = await tryKdialog();
	if (kdialog) {
		return kdialog;
	}

	return {
		ok: false,
		cancelled: false,
		message: 'Установите zenity или kdialog для выбора папки',
	};
};

const pickLinuxFile = async (prompt: string): Promise<PickPathResult> => {
	const tryZenity = async (): Promise<PickPathResult | undefined> => {
		try {
			const {stdout} = await execa('zenity', [
				'--file-selection',
				`--title=${prompt}`,
				'--file-filter=Логи (*.log) | *.log',
				'--file-filter=Все файлы | *',
			]);
			const chosen = trimPath(stdout);
			return chosen ? {ok: true, path: chosen} : {ok: false, cancelled: true};
		} catch (error: unknown) {
			if (exitCode(error) === 1) {
				return {ok: false, cancelled: true};
			}

			return undefined;
		}
	};

	const tryKdialog = async (): Promise<PickPathResult | undefined> => {
		try {
			const {stdout} = await execa('kdialog', [
				'--title',
				prompt,
				'--getopenfilename',
				'.',
				'*.log|Log files',
			]);
			const chosen = trimPath(stdout);
			return chosen ? {ok: true, path: chosen} : {ok: false, cancelled: true};
		} catch (error: unknown) {
			if (exitCode(error) === 1) {
				return {ok: false, cancelled: true};
			}

			return undefined;
		}
	};

	const zenity = await tryZenity();
	if (zenity) {
		return zenity;
	}

	const kdialog = await tryKdialog();
	if (kdialog) {
		return kdialog;
	}

	return {
		ok: false,
		cancelled: false,
		message: 'Установите zenity или kdialog для выбора файла',
	};
};

const pickWindowsFolder = async (prompt: string): Promise<PickPathResult> => {
	const script = [
		'Add-Type -AssemblyName System.Windows.Forms',
		'$d = New-Object System.Windows.Forms.FolderBrowserDialog',
		`$d.Description = ${JSON.stringify(prompt)}`,
		'$d.ShowNewFolderButton = $false',
		'if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.SelectedPath }',
	].join('; ');

	try {
		const {stdout} = await execa('powershell', [
			'-NoProfile',
			'-Command',
			script,
		]);
		const chosen = trimPath(stdout);
		if (!chosen) {
			return {ok: false, cancelled: true};
		}

		return {ok: true, path: chosen};
	} catch (error) {
		return {
			ok: false,
			cancelled: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
};

const pickWindowsFile = async (prompt: string): Promise<PickPathResult> => {
	const script = [
		'Add-Type -AssemblyName System.Windows.Forms',
		'$d = New-Object System.Windows.Forms.OpenFileDialog',
		`$d.Title = ${JSON.stringify(prompt)}`,
		`$d.Filter = 'Log files (*.log)|*.log|All files (*.*)|*.*'`,
		'$d.CheckFileExists = $true',
		'if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.FileName }',
	].join('; ');

	try {
		const {stdout} = await execa('powershell', [
			'-NoProfile',
			'-Command',
			script,
		]);
		const chosen = trimPath(stdout);
		if (!chosen) {
			return {ok: false, cancelled: true};
		}

		return {ok: true, path: chosen};
	} catch (error) {
		return {
			ok: false,
			cancelled: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
};

/** Opens a native folder picker. Returns cancelled if the user dismisses the dialog. */
export const pickFolder = async (
	options: PickOptions = {},
): Promise<PickPathResult> => {
	const prompt = options.prompt ?? defaultFolderPrompt;
	const os = platform();
	if (os === 'darwin') {
		return pickMacFolder(prompt);
	}

	if (os === 'win32') {
		return pickWindowsFolder(prompt);
	}

	return pickLinuxFolder(prompt);
};

/** Opens a native file picker (defaults to .log). */
export const pickFile = async (
	options: PickOptions = {},
): Promise<PickPathResult> => {
	const prompt = options.prompt ?? defaultFilePrompt;
	const os = platform();
	if (os === 'darwin') {
		return pickMacFile(prompt);
	}

	if (os === 'win32') {
		return pickWindowsFile(prompt);
	}

	return pickLinuxFile(prompt);
};
