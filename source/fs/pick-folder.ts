import {platform} from 'node:os';
import {execa} from 'execa';

export type PickFolderResult =
	| {ok: true; path: string}
	| {ok: false; cancelled: boolean; message?: string};

const trimPath = (raw: string): string =>
	raw.trim().replace(/\r/g, '').replace(/\/$/, '') || raw.trim();

const pickMac = async (): Promise<PickFolderResult> => {
	try {
		const {stdout} = await execa('osascript', [
			'-e',
			'try',
			'-e',
			'POSIX path of (choose folder with prompt "Выберите папку для сжатия")',
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

const pickLinux = async (): Promise<PickFolderResult> => {
	const tryZenity = async (): Promise<PickFolderResult | undefined> => {
		try {
			const {stdout} = await execa('zenity', [
				'--file-selection',
				'--directory',
				'--title=Выберите папку для сжатия',
			]);
			const chosen = trimPath(stdout);
			return chosen ? {ok: true, path: chosen} : {ok: false, cancelled: true};
		} catch (error: unknown) {
			const code =
				error && typeof error === 'object' && 'exitCode' in error
					? (error as {exitCode?: number}).exitCode
					: undefined;
			if (code === 1) {
				return {ok: false, cancelled: true};
			}

			return undefined;
		}
	};

	const tryKdialog = async (): Promise<PickFolderResult | undefined> => {
		try {
			const {stdout} = await execa('kdialog', ['--getexistingdirectory', '.']);
			const chosen = trimPath(stdout);
			return chosen ? {ok: true, path: chosen} : {ok: false, cancelled: true};
		} catch (error: unknown) {
			const code =
				error && typeof error === 'object' && 'exitCode' in error
					? (error as {exitCode?: number}).exitCode
					: undefined;
			if (code === 1) {
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

const pickWindows = async (): Promise<PickFolderResult> => {
	const script = [
		'Add-Type -AssemblyName System.Windows.Forms',
		'$d = New-Object System.Windows.Forms.FolderBrowserDialog',
		'$d.Description = "Выберите папку для сжатия"',
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

/** Opens a native folder picker. Returns cancelled if the user dismisses the dialog. */
export const pickFolder = async (): Promise<PickFolderResult> => {
	const os = platform();
	if (os === 'darwin') {
		return pickMac();
	}

	if (os === 'win32') {
		return pickWindows();
	}

	return pickLinux();
};
