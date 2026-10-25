import path from 'node:path';
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

	// HEIC/HEIF/TIFF/GIF/JPEG → jpeg when keeping "same" for unsupported keep
	if (ext === '.jpg' || ext === '.jpeg') {
		return {format: 'jpeg', ext: '.jpg'};
	}

	return {format: 'jpeg', ext: '.jpg'};
};

export const compressPhoto = async (
	filePath: string,
	settings: Pick<
		CompressSettings,
		'photoFormat' | 'megapixels' | 'photoQuality' | 'replaceFiles'
	>,
): Promise<FileResult> => {
	try {
		const image = sharp(filePath, {failOn: 'none'}).rotate();
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

		const {format, ext} = resolveOutputFormat(filePath, settings.photoFormat);
		const quality = Math.min(100, Math.max(1, settings.photoQuality));

		if (format === 'jpeg') {
			pipeline = pipeline.jpeg({quality, mozjpeg: true});
		} else if (format === 'webp') {
			pipeline = pipeline.webp({quality});
		} else {
			pipeline = pipeline.png({compressionLevel: 9});
		}

		const tmp = tempPathFor(filePath, ext);
		await pipeline.toFile(tmp);

		const replaceTarget =
			settings.replaceFiles && path.extname(filePath).toLowerCase() !== ext
				? filePath.slice(0, filePath.length - path.extname(filePath).length) +
				  ext
				: undefined;

		return await commitOutput({
			sourcePath: filePath,
			tempPath: tmp,
			kind: 'photo',
			replaceFiles: settings.replaceFiles,
			outputExt: ext,
			replaceTargetPath: replaceTarget,
		});
	} catch (error) {
		return {
			path: filePath,
			kind: 'photo',
			status: 'error',
			bytesBefore: 0,
			bytesAfter: 0,
			errorMessage: error instanceof Error ? error.message : String(error),
		};
	}
};
