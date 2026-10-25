import {stat} from 'node:fs/promises';
import pLimit from 'p-limit';
import {createLogger, buildSummary} from '../log.js';
import {scanDirectory} from '../scan.js';
import type {
	CompressSettings,
	FileResult,
	RunSummary,
	ScannedFile,
} from '../types.js';
import {compressPhoto} from './photo.js';
import {compressVideo} from './video.js';

export type ProgressEvent = {
	done: number;
	total: number;
	current: string;
	result?: FileResult;
};

export const runCompression = async (
	settings: CompressSettings,
	onProgress?: (event: ProgressEvent) => void,
): Promise<RunSummary> => {
	const logger = await createLogger(settings.rootDir);
	const scan = await scanDirectory(settings);

	for (const item of scan.skippedSmall) {
		await logger.logResult({
			path: item.path,
			kind: item.kind,
			status: 'skip_small',
			bytesBefore: item.sizeBytes,
			bytesAfter: item.sizeBytes,
		});
	}

	for (const item of scan.skippedCompressed) {
		await logger.logResult({
			path: item.path,
			kind: item.kind,
			status: 'skip_compressed',
			bytesBefore: item.sizeBytes,
			bytesAfter: item.sizeBytes,
		});
	}

	const photos = scan.toProcess.filter(f => f.kind === 'photo');
	const videos = scan.toProcess.filter(f => f.kind === 'video');
	const total = photos.length + videos.length;
	const results: FileResult[] = [];
	let done = 0;

	const handleOne = async (file: ScannedFile): Promise<FileResult> => {
		let result: FileResult;
		if (file.kind === 'photo') {
			result = await compressPhoto(file.path, settings);
		} else {
			result = await compressVideo(file.path, settings);
		}

		if (result.bytesBefore === 0) {
			try {
				const s = await stat(file.path);
				result = {
					...result,
					bytesBefore: s.size,
					bytesAfter: result.status === 'ok' ? result.bytesAfter : s.size,
				};
			} catch {
				result = {
					...result,
					bytesBefore: file.sizeBytes,
					bytesAfter: file.sizeBytes,
				};
			}
		}

		await logger.logResult(result);
		done++;
		onProgress?.({
			done,
			total,
			current: file.path,
			result,
		});
		return result;
	};

	const photoLimit = pLimit(Math.max(1, settings.photoWorkers));
	const photoResults = await Promise.all(
		photos.map(async file => photoLimit(async () => handleOne(file))),
	);
	results.push(...photoResults);

	for (const file of videos) {
		results.push(await handleOne(file));
	}

	const summary = buildSummary(
		results,
		scan.skippedSmall.length,
		scan.skippedCompressed.length,
		logger.logPath,
	);

	// found should include only processed queue; plan says found = to process
	summary.found = total;
	// bytes for skipped-at-scan not in results — adjust skip counts already set

	await logger.writeSummary(summary);
	return summary;
};
