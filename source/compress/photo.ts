import path from 'node:path';
import {rm} from 'node:fs/promises';
import sharp from 'sharp';
import {scaledSize, targetPixelsForMp} from '../presets.js';
import type {CompressSettings, FileResult, PhotoFormatMode} from '../types.js';
import {commitOutput, tempPathFor} from './write.js';

const resolveOutputFormat = (
	sourcePath: string,
	mode: PhotoFormatMode,
): {format: 'jpeg' | 'png' | 'webp'; ext: string} => {
	const ext = path.extname(sourcePath).toLowerCase();

	if (mode === 'jpeg') {
		return {format: 'jpeg', ext: '.jpg'};
	}

	if (mode === 'webp') {
		return {format: 'webp', ext: '.webp'};
	}

	if (ext === '.png') {
		return {format: 'png', ext: '.png'};
	}

	if (ext === '.webp') {
		return {format: 'webp', ext: '.webp'};
	}

	if (ext === '.jpg' || ext === '.jpeg') {
		return {format: 'jpeg', ext: '.jpg'};
	}

	return {format: 'jpeg', ext: '.jpg'};
};

export type CompressPhotoOptions = {
	/** Original path for size compare + final write (HDD). Defaults to workPath. */
	commitPath?: string;
	/** Called after encode finishes, before commit — e.g. delete staged input. */
	onEncoded?: () => Promise<void>;
};

export const compressPhoto = async (
	workPath: string,
	settings: Pick<
		CompressSettings,
		'photoFormat' | 'megapixels' | 'photoQuality' | 'replaceFiles'
	>,
	options: CompressPhotoOptions = {},
): Promise<FileResult> => {
	const commitPath = options.commitPath ?? workPath;
	let tmp: string | undefined;

	try {
		const image = sharp(workPath, {failOn: 'none'}).rotate();
		const meta = await image.metadata();
		const width = meta.width ?? 0;
		const height = meta.height ?? 0;

		const targetPixels = targetPixelsForMp(settings.megapixels);
		let pipeline = image;
		if (targetPixels && width > 0 && height > 0) {
			const next = scaledSize(width, height, targetPixels);
			if (next) {
				pipeline = pipeline.resize({
					width: next.width,
					height: next.height,
					fit: 'inside',
					withoutEnlargement: true,
				});
			}
		}

		const {format, ext} = resolveOutputFormat(workPath, settings.photoFormat);
		const quality = Math.min(100, Math.max(1, settings.photoQuality));

		if (format === 'jpeg') {
			pipeline = pipeline.jpeg({quality, mozjpeg: true});
		} else if (format === 'webp') {
			pipeline = pipeline.webp({quality});
		} else {
			pipeline = pipeline.png({compressionLevel: 9});
		}

		tmp = tempPathFor(workPath, ext);
		await pipeline.toFile(tmp);
		await options.onEncoded?.();

		const replaceTarget =
			settings.replaceFiles && path.extname(commitPath).toLowerCase() !== ext
				? commitPath.slice(
						0,
						commitPath.length - path.extname(commitPath).length,
				  ) + ext
				: undefined;

		return await commitOutput({
			sourcePath: commitPath,
			tempPath: tmp,
			kind: 'photo',
			replaceFiles: settings.replaceFiles,
			outputExt: ext,
			replaceTargetPath: replaceTarget,
		});
	} catch (error) {
		if (tmp) {
			await rm(tmp, {force: true}).catch(() => undefined);
		}

		return {
			path: commitPath,
			kind: 'photo',
			status: 'error',
			bytesBefore: 0,
			bytesAfter: 0,
			errorMessage: error instanceof Error ? error.message : String(error),
		};
	}
};
