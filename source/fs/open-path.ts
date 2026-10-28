import path from 'node:path';
import process from 'node:process';
import {execa} from 'execa';

export type OpenRunner = (command: string, args: string[]) => Promise<unknown>;

export const openCommandForPlatform = (
	dir: string,
	platform: NodeJS.Platform = process.platform,
): {command: string; args: string[]} => {
	if (platform === 'darwin') {
		return {command: 'open', args: [dir]};
	}

	if (platform === 'win32') {
		return {command: 'explorer', args: [dir]};
	}

	return {command: 'xdg-open', args: [dir]};
};

const defaultRunner: OpenRunner = async (command, args) =>
	execa(command, args, {stdio: 'ignore', reject: false});

/** Open the directory that contains `filePath` in the OS file manager. */
export const openContainingFolder = async (
	filePath: string,
	runner: OpenRunner = defaultRunner,
	platform: NodeJS.Platform = process.platform,
): Promise<void> => {
	const dir = path.dirname(filePath);
	const {command, args} = openCommandForPlatform(dir, platform);
	await runner(command, args);
};
