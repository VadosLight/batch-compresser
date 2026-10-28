import {readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {isBelowMinSize, isCompressedName} from './presets.js';
import type {CompressSettings, MediaKind, ScannedFile} from './types.js';
import {
	CORE_VIDEO_EXTENSIONS,
	resolveVideoExtensions,
} from './video-extensions.js';

const PHOTO_EXT = new Set([
	'.jpg',
	'.jpeg',
	'.png',
	'.webp',
	'.tif',
	'.tiff',
	'.heic',
	'.heif',
	'.gif',
]);

export const detectKind = (
	filePath: string,
	videoExtensions: ReadonlySet<string> = CORE_VIDEO_EXTENSIONS,
): MediaKind | undefined => {
	const ext = path.extname(filePath).toLowerCase();
	if (PHOTO_EXT.has(ext)) {
		return 'photo';
	}

	if (videoExtensions.has(ext)) {
		return 'video';
	}

	return undefined;
};

export type ScanOutcome = {
	toProcess: ScannedFile[];
	skippedSmall: ScannedFile[];
	skippedCompressed: ScannedFile[];
	skippedPrevious: ScannedFile[];
};

const walk = async (dir: string): Promise<string[]> => {
	const entries = await readdir(dir, {withFileTypes: true});
	const files: string[] = [];

	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walk(full)));
		} else if (entry.isFile()) {
			files.push(full);
		}
	}

	return files;
};

export const scanDirectory = async (
	settings: Pick<
		CompressSettings,
		| 'rootDir'
		| 'processPhotos'
		| 'processVideos'
		| 'minPhotoMb'
		| 'minVideoMb'
		| 'videoScanAllFormats'
	>,
	processedPaths: ReadonlySet<string> = new Set(),
): Promise<ScanOutcome> => {
	const videoExtensions = settings.processVideos
		? await resolveVideoExtensions(settings.videoScanAllFormats)
		: CORE_VIDEO_EXTENSIONS;
	const allPaths = await walk(settings.rootDir);
	const toProcess: ScannedFile[] = [];
	const skippedSmall: ScannedFile[] = [];
	const skippedCompressed: ScannedFile[] = [];
	const skippedPrevious: ScannedFile[] = [];

	for (const filePath of allPaths) {
		const kind = detectKind(filePath, videoExtensions);
		if (!kind) {
			continue;
		}

		if (kind === 'photo' && !settings.processPhotos) {
			continue;
		}

		if (kind === 'video' && !settings.processVideos) {
			continue;
		}

		const info = await stat(filePath);
		const item: ScannedFile = {
			path: filePath,
			kind,
			sizeBytes: info.size,
		};

		if (isCompressedName(filePath)) {
			skippedCompressed.push(item);
			continue;
		}

		const minMb = kind === 'photo' ? settings.minPhotoMb : settings.minVideoMb;
		if (isBelowMinSize(info.size, minMb)) {
			skippedSmall.push(item);
			continue;
		}

		if (processedPaths.has(path.resolve(filePath))) {
			skippedPrevious.push(item);
			continue;
		}

		toProcess.push(item);
	}

	return {toProcess, skippedSmall, skippedCompressed, skippedPrevious};
};
