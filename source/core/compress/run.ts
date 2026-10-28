import {stat} from 'node:fs/promises';
import pLimit from 'p-limit';
import {loadProcessedPathsFromLogs} from '../fs/previous-logs.js';
import {
	cleanupStagedFile,
	cleanupStageSession,
	createStageSession,
	stageFile,
} from '../fs/stage.js';
import {createLogger, buildSummary} from '../log.js';
import {maxVideoWorkers} from '../presets.js';
import {scanDirectory} from '../scan.js';
import type {
	CompressSettings,
	FileResult,
	MediaKind,
	RunSummary,
	ScannedFile,
} from '../types.js';
import {isCancelError} from './abort.js';
import {
	createConcurrencyLimiter,
	type ConcurrencyLimiter,
} from './concurrency.js';
import {compressPhoto} from './photo.js';
import {sampleResourceAdvice, type ResourceAdvice} from './resource-advice.js';
import {compressVideo} from './video.js';

export type ActiveJobProgress = {
	path: string;
	kind: MediaKind;
	status: string;
	filePercent: number;
};

/** Ascending by size so small videos start first when enabled. */
export const orderVideosForProcessing = (
	videos: ScannedFile[],
	smallFirst: boolean,
): ScannedFile[] => {
	if (!smallFirst || videos.length < 2) {
		return videos;
	}

	return [...videos].sort((a, b) => {
		const bySize = a.sizeBytes - b.sizeBytes;
		if (bySize !== 0) {
			return bySize;
		}

		return a.path.localeCompare(b.path);
	});
};

export type ProgressEvent = {
	done: number;
	total: number;
	current: string;
	kind?: MediaKind;
	status?: string;
	filePercent?: number;
	activeJobs: ActiveJobProgress[];
	/** Cumulative size of finished files (before compression). */
	bytesBefore: number;
	/** Cumulative size after finish (original size if skipped/error). */
	bytesAfter: number;
	result?: FileResult;
	videoWorkers: number;
	resourceAdvice?: ResourceAdvice;
};

export type RunControls = {
	skipVideo: (path: string) => void;
	setVideoWorkers: (n: number) => void;
	getVideoWorkers: () => number;
};

export type RunCompressionHandlers = {
	onProgress?: (event: ProgressEvent) => void;
	onControls?: (controls: RunControls) => void;
};

export const runCompression = async (
	settings: CompressSettings,
	handlers?: RunCompressionHandlers | ((event: ProgressEvent) => void),
): Promise<RunSummary> => {
	const startedAt = Date.now();
	const onProgress =
		typeof handlers === 'function' ? handlers : handlers?.onProgress;
	const onControls =
		typeof handlers === 'function' ? undefined : handlers?.onControls;

	const logger = await createLogger(settings.rootDir, settings);
	const {paths: processedPaths} = await loadProcessedPathsFromLogs(
		settings.previousLogsPath,
	);
	const scan = await scanDirectory(settings, processedPaths);

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

	for (const item of scan.skippedPrevious) {
		await logger.logResult({
			path: item.path,
			kind: item.kind,
			status: 'skip_previous',
			bytesBefore: item.sizeBytes,
			bytesAfter: item.sizeBytes,
		});
	}

	const photos = scan.toProcess.filter(f => f.kind === 'photo');
	const videos = orderVideosForProcessing(
		scan.toProcess.filter(f => f.kind === 'video'),
		settings.videosSmallFirst,
	);
	const total = photos.length + videos.length;
	const results: FileResult[] = [];
	let done = 0;
	let bytesBefore = 0;
	let bytesAfter = 0;
	const active = new Map<string, ActiveJobProgress>();
	const videoAbortControllers = new Map<string, AbortController>();
	const videoMax = maxVideoWorkers();
	const videoLimit: ConcurrencyLimiter = createConcurrencyLimiter(
		Math.max(1, settings.videoWorkers),
		{max: videoMax},
	);
	let videoPhase = false;
	let lastProgressFile: ScannedFile | undefined;

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

	const accountResult = (result: FileResult): void => {
		bytesBefore += result.bytesBefore;
		bytesAfter +=
			result.status === 'ok' ? result.bytesAfter : result.bytesBefore;
	};

	const buildAdvice = (): ResourceAdvice | undefined => {
		if (!videoPhase) {
			return undefined;
		}

		return sampleResourceAdvice({
			videoWorkers: videoLimit.getConcurrency(),
			maxWorkers: videoMax,
			pendingCount: videoLimit.pendingCount,
		});
	};

	const emit = (file: ScannedFile, extra?: Partial<ProgressEvent>): void => {
		lastProgressFile = file;
		onProgress?.({
			done,
			total,
			current: file.path,
			kind: file.kind,
			activeJobs: snapshotActive(),
			bytesBefore,
			bytesAfter,
			videoWorkers: videoLimit.getConcurrency(),
			resourceAdvice: buildAdvice(),
			...extra,
		});
	};

	const emitWorkersChanged = (): void => {
		const file = lastProgressFile ?? {
			path: '',
			kind: 'video' as const,
			sizeBytes: 0,
		};
		emit(file);
	};

	onControls?.({
		skipVideo(path: string) {
			videoAbortControllers.get(path)?.abort();
		},
		setVideoWorkers(n: number) {
			videoLimit.setConcurrency(n);
			if (videoPhase) {
				emitWorkersChanged();
			}
		},
		getVideoWorkers() {
			return videoLimit.getConcurrency();
		},
	});

	const fillBytes = async (
		file: ScannedFile,
		result: FileResult,
	): Promise<FileResult> => {
		if (result.bytesBefore !== 0) {
			return result;
		}

		try {
			const s = await stat(file.path);
			return {
				...result,
				bytesBefore: s.size,
				bytesAfter: result.status === 'ok' ? result.bytesAfter : s.size,
			};
		} catch {
			return {
				...result,
				bytesBefore: file.sizeBytes,
				bytesAfter: file.sizeBytes,
			};
		}
	};

	const finishResult = async (
		file: ScannedFile,
		result: FileResult,
	): Promise<FileResult> => {
		const filled = await fillBytes(file, result);
		await logger.logResult(filled);
		active.delete(file.path);
		videoAbortControllers.delete(file.path);
		done++;
		accountResult(filled);
		emit(file, {
			status: 'done',
			filePercent: 100,
			result: filled,
		});
		return filled;
	};

	const handleOne = async (file: ScannedFile): Promise<FileResult> => {
		setActive(file, file.kind === 'video' ? 'probe' : 'compress', 0);
		emit(file, {
			status: file.kind === 'video' ? 'probe' : 'compress',
			filePercent: 0,
		});

		let workPath = file.path;
		const commitPath = file.path;
		let controller: AbortController | undefined;

		if (file.kind === 'video') {
			controller = new AbortController();
			videoAbortControllers.set(file.path, controller);
		}

		const signal = controller?.signal;

		try {
			if (signal?.aborted) {
				return await finishResult(file, {
					path: file.path,
					kind: file.kind,
					status: 'skip_user',
					bytesBefore: file.sizeBytes,
					bytesAfter: file.sizeBytes,
				});
			}

			if (sessionDir) {
				setActive(file, 'stage', 0);
				emit(file, {status: 'stage', filePercent: 0});
				workPath = await stageFile(file.path, sessionDir);
				if (signal?.aborted) {
					await cleanupStagedFile(workPath, commitPath);
					return await finishResult(file, {
						path: file.path,
						kind: file.kind,
						status: 'skip_user',
						bytesBefore: file.sizeBytes,
						bytesAfter: file.sizeBytes,
					});
				}
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
					{commitPath, onEncoded: releaseStagedInput, signal},
				);
			}

			await cleanupStagedFile(workPath, commitPath);
			return await finishResult(file, result);
		} catch (error) {
			await cleanupStagedFile(workPath, commitPath);

			if (isCancelError(error, signal)) {
				return await finishResult(file, {
					path: file.path,
					kind: file.kind,
					status: 'skip_user',
					bytesBefore: file.sizeBytes,
					bytesAfter: file.sizeBytes,
				});
			}

			return await finishResult(file, {
				path: file.path,
				kind: file.kind,
				status: 'error',
				bytesBefore: file.sizeBytes,
				bytesAfter: file.sizeBytes,
				errorMessage: error instanceof Error ? error.message : String(error),
			});
		} finally {
			videoAbortControllers.delete(file.path);
		}
	};

	try {
		const photoLimit = pLimit(Math.max(1, settings.photoWorkers));
		const photoResults = await Promise.all(
			photos.map(async file => photoLimit(async () => handleOne(file))),
		);
		results.push(...photoResults);

		videoPhase = true;
		const videoResults = await Promise.all(
			videos.map(async file => videoLimit.run(async () => handleOne(file))),
		);
		results.push(...videoResults);
	} finally {
		await cleanupStageSession(sessionDir);
	}

	const summary = buildSummary(
		results,
		{
			skipSmall: scan.skippedSmall.length,
			skipCompressed: scan.skippedCompressed.length,
			skipPrevious: scan.skippedPrevious.length,
		},
		logger.logPath,
		Date.now() - startedAt,
	);

	summary.found = total;

	await logger.writeSummary(summary);
	return summary;
};
