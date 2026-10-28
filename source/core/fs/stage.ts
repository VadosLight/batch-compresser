import {createHash} from 'node:crypto';
import {copyFile, mkdir, rm, unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import process from 'node:process';

export const defaultStageDir = (): string =>
	path.join(tmpdir(), 'batch-compresser');

export const createStageSession = async (
	stageRoot: string,
): Promise<string> => {
	const sessionDir = path.join(stageRoot, `run-${Date.now()}-${process.pid}`);
	await mkdir(sessionDir, {recursive: true});
	return sessionDir;
};

export const stageFile = async (
	sourcePath: string,
	sessionDir: string,
): Promise<string> => {
	const hash = createHash('sha1').update(sourcePath).digest('hex').slice(0, 12);
	const base = path.basename(sourcePath);
	const dest = path.join(sessionDir, `${hash}-${base}`);
	await copyFile(sourcePath, dest);
	return dest;
};

/** Remove staged input as soon as encode no longer needs it (frees SSD during long runs). */
export const cleanupStagedFile = async (
	workPath: string,
	originalPath: string,
): Promise<void> => {
	if (path.resolve(workPath) === path.resolve(originalPath)) {
		return;
	}

	await unlink(workPath).catch(() => undefined);
};

export const cleanupStageSession = async (
	sessionDir: string | undefined,
): Promise<void> => {
	if (!sessionDir) {
		return;
	}

	await rm(sessionDir, {recursive: true, force: true}).catch(() => undefined);
};
