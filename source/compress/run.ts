import {stat} from 'node:fs/promises';
import pLimit from 'p-limit';
import {
	cleanupStagedFile,
	cleanupStageSession,
	createStageSession,
	stageFile,
} from '../fs/stage.js';
import {createLogger, buildSummary} from '../log.js';
import {scanDirectory} from '../scan.js';
import type {
	CompressSettings,
	FileResult,
	MediaKind,
	RunSummary,
	ScannedFile,
} from '../types.js';
import {compressPhoto} from './photo.js';
import {compressVideo} from './video.js';

export type ActiveJobProgress = {
	path: string;
	kind: MediaKind;
	status: string;
	filePercent: number;
};

export type ProgressEvent = {
	done: number;
	total: number;
	current: string;
	kind?: MediaKind;
	status?: string;
	filePercent?: number;
	activeJobs: ActiveJobProgress[];
	result?: FileResult;
};

export const runCompression = async (
	settings: CompressSettings,
	onProgress?: (event: ProgressEvent) => void,
): Promise<RunSummary> => {
	const logger = await createLogger(settings.rootDir, settings);
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
	const active = new Map<string, ActiveJobProgress>();

	const sessionDir = settings.stageToFastDisk
		? await createStageSession(settings.stageDir)
		: undefined;

	const snapshotActive = (): ActiveJobProgress[] => [...active.values()];

	const setActive = (
		file: ScannedFile,
		status: string,
		filePercent: number,
	): void => {
		active.set(file.path, {
			path: file.path,
			kind: file.kind,
			status,
			filePercent,
		});
	};

	const emit = (file: ScannedFile, extra?: Partial<ProgressEvent>): void => {
		onProgress?.({
			done,
			total,
			current: file.path,
			kind: file.kind,
			activeJobs: snapshotActive(),
			...extra,
		});
	};

	const handleOne = async (file: ScannedFile): Promise<FileResult> => {
		setActive(file, file.kind === 'video' ? 'probe' : 'compress', 0);
		emit(file, {
			status: file.kind === 'video' ? 'probe' : 'compress',
			filePercent: 0,
		});

		let workPath = file.path;
		const commitPath = file.path;

		try {
			if (sessionDir) {
				setActive(file, 'stage', 0);
				emit(file, {status: 'stage', filePercent: 0});
				workPath = await stageFile(file.path, sessionDir);
			}

			const releaseStagedInput = async (): Promise<void> => {
				await cleanupStagedFile(workPath, commitPath);
				workPath = commitPath;
			};

			let result: FileResult;
			if (file.kind === 'photo') {
				result = await compressPhoto(workPath, settings, {
					commitPath,
					onEncoded: releaseStagedInput,
				});
			} else {
				result = await compressVideo(
					workPath,
					settings,
					update => {
						setActive(file, update.status, update.percent);
						emit(file, {
							status: update.status,
							filePercent: update.percent,
						});
					},
					{commitPath, onEncoded: releaseStagedInput},
				);
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
			active.delete(file.path);
			done++;
			emit(file, {
				status: 'done',
				filePercent: 100,
				result,
			});
			return result;
		} catch (error) {
			await cleanupStagedFile(workPath, commitPath);
			const result: FileResult = {
				path: file.path,
				kind: file.kind,
				status: 'error',
				bytesBefore: file.sizeBytes,
				bytesAfter: file.sizeBytes,
				errorMessage: error instanceof Error ? error.message : String(error),
			};
			await logger.logResult(result);
			active.delete(file.path);
			done++;
			emit(file, {status: 'done', filePercent: 100, result});
			return result;
		}
	};

	try {
		const photoLimit = pLimit(Math.max(1, settings.photoWorkers));
		const photoResults = await Promise.all(
			photos.map(async file => photoLimit(async () => handleOne(file))),
		);
		results.push(...photoResults);

		const videoLimit = pLimit(Math.max(1, settings.videoWorkers));
		const videoResults = await Promise.all(
			videos.map(async file => videoLimit(async () => handleOne(file))),
		);
		results.push(...videoResults);
	} finally {
		await cleanupStageSession(sessionDir);
	}

	const summary = buildSummary(
		results,
		scan.skippedSmall.length,
		scan.skippedCompressed.length,
		logger.logPath,
	);

	summary.found = total;

	await logger.writeSummary(summary);
	return summary;
};
