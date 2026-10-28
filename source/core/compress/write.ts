import {copyFile, rename, rm, stat, unlink} from 'node:fs/promises';
import path from 'node:path';
import {compressedSiblingPath} from '../presets.js';
import type {FileResult, FileStatus, MediaKind} from '../types.js';

/** Video must shrink by at least this fraction, otherwise keep original. */
export const videoMinSavingsRatio = 0.03;

export type CommitOptions = {
	/** Path used for size compare and final destination (usually original on HDD). */
	sourcePath: string;
	tempPath: string;
	kind: MediaKind;
	replaceFiles: boolean;
	/** Extension for output when not replacing same path (e.g. .mp4, .jpg) */
	outputExt: string;
	/** When replacing video with different ext, final path may differ */
	replaceTargetPath?: string;
	/**
	 * Minimum relative savings `(before-after)/before` to accept the result.
	 * Below this (or if larger), discard output and keep original.
	 */
	minSavingsRatio?: number;
};

/** Move file; falls back to copy+unlink across devices (HDD ↔ SSD). */
export const moveFile = async (from: string, to: string): Promise<void> => {
	try {
		await rename(from, to);
	} catch (error) {
		const code =
			error && typeof error === 'object' && 'code' in error
				? (error as {code?: string}).code
				: undefined;
		if (code !== 'EXDEV') {
			throw error;
		}

		await copyFile(from, to);
		await unlink(from);
	}
};

export const savingsRatio = (before: number, after: number): number => {
	if (!(before > 0)) {
		return 0;
	}

	return (before - after) / before;
};

export const rejectReasonForSizes = (
	before: number,
	after: number,
	minSavingsRatio = 0,
): Extract<FileStatus, 'skip_larger' | 'skip_low_gain'> | undefined => {
	if (after >= before) {
		return 'skip_larger';
	}

	if (minSavingsRatio > 0 && savingsRatio(before, after) < minSavingsRatio) {
		return 'skip_low_gain';
	}

	return undefined;
};

export const commitOutput = async (
	options: CommitOptions,
): Promise<FileResult> => {
	const before = (await stat(options.sourcePath)).size;
	const afterStat = await stat(options.tempPath);
	const after = afterStat.size;
	const minSavings = options.minSavingsRatio ?? 0;

	const reject = rejectReasonForSizes(before, after, minSavings);
	if (reject) {
		await rm(options.tempPath, {force: true});
		return {
			path: options.sourcePath,
			kind: options.kind,
			status: reject,
			bytesBefore: before,
			bytesAfter: before,
		};
	}

	try {
		if (options.replaceFiles) {
			const target = options.replaceTargetPath ?? options.sourcePath;
			await moveFile(options.tempPath, target);
			if (path.resolve(target) !== path.resolve(options.sourcePath)) {
				await unlink(options.sourcePath).catch(() => {
					/* original may already be gone */
				});
			}
		} else {
			const dest = compressedSiblingPath(options.sourcePath, options.outputExt);
			await moveFile(options.tempPath, dest);
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
