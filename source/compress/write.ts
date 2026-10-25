import {rename, rm, stat, unlink} from 'node:fs/promises';
import path from 'node:path';
import {compressedSiblingPath} from '../presets.js';
import type {FileResult, MediaKind} from '../types.js';

export type CommitOptions = {
	sourcePath: string;
	tempPath: string;
	kind: MediaKind;
	replaceFiles: boolean;
	/** Extension for output when not replacing same path (e.g. .mp4, .jpg) */
	outputExt: string;
	/** When replacing video with different ext, final path may differ */
	replaceTargetPath?: string;
};

export const commitOutput = async (
	options: CommitOptions,
): Promise<FileResult> => {
	const before = (await stat(options.sourcePath)).size;
	const afterStat = await stat(options.tempPath);
	const after = afterStat.size;

	if (after >= before) {
		await rm(options.tempPath, {force: true});
		return {
			path: options.sourcePath,
			kind: options.kind,
			status: 'skip_larger',
			bytesBefore: before,
			bytesAfter: before,
		};
	}

	try {
		if (options.replaceFiles) {
			const target = options.replaceTargetPath ?? options.sourcePath;
			if (path.resolve(target) === path.resolve(options.sourcePath)) {
				await rename(options.tempPath, target);
			} else {
				await rename(options.tempPath, target);
				if (path.resolve(target) !== path.resolve(options.sourcePath)) {
					await unlink(options.sourcePath).catch(() => {
						/* original may already be gone */
					});
				}
			}
		} else {
			const dest = compressedSiblingPath(options.sourcePath, options.outputExt);
			await rename(options.tempPath, dest);
		}

		return {
			path: options.sourcePath,
			kind: options.kind,
			status: 'ok',
			bytesBefore: before,
			bytesAfter: after,
		};
	} catch (error) {
		await rm(options.tempPath, {force: true}).catch(() => undefined);
		return {
			path: options.sourcePath,
			kind: options.kind,
			status: 'error',
			bytesBefore: before,
			bytesAfter: before,
			errorMessage: error instanceof Error ? error.message : String(error),
		};
	}
};

export const tempPathFor = (filePath: string, ext: string): string => {
	const dir = path.dirname(filePath);
	const base = path.basename(filePath);
	return path.join(dir, `.${base}.${Date.now()}.tmp${ext}`);
};
