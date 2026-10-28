import {appendFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {durationTier, formatDuration} from './duration.js';
import {formatBytes} from './format-bytes.js';
import type {CompressSettings, FileResult, RunSummary} from './types.js';

const pad = (n: number): string => String(n).padStart(2, '0');

export const makeLogFileName = (date = new Date()): string => {
	const y = date.getFullYear();
	const m = pad(date.getMonth() + 1);
	const d = pad(date.getDate());
	const h = pad(date.getHours());
	const min = pad(date.getMinutes());
	const s = pad(date.getSeconds());
	const ms = String(date.getMilliseconds()).padStart(3, '0');
	return `batch-compressor-${y}${m}${d}-${h}${min}${s}-${ms}.log`;
};

export const formatSettingsBlock = (settings: CompressSettings): string => {
	const photoMp =
		settings.megapixels === 0 ? 'unchanged' : `${settings.megapixels}MP`;
	const videoHeight =
		settings.videoMaxHeight === 0 ? 'source' : `${settings.videoMaxHeight}p`;
	const previousLogs = settings.previousLogsPath.trim() || 'none';

	const lines = [
		'=== SETTINGS ===',
		`rootDir=${settings.rootDir}`,
		`processPhotos=${settings.processPhotos ? 'yes' : 'no'}`,
		`processVideos=${settings.processVideos ? 'yes' : 'no'}`,
	];

	if (settings.processPhotos) {
		lines.push(
			`minPhotoMb=${settings.minPhotoMb}`,
			`photoFormat=${settings.photoFormat}`,
			`megapixels=${photoMp}`,
			`photoPreset=${settings.photoPreset}`,
			`photoQuality=${settings.photoQuality}`,
			`photoWorkers=${settings.photoWorkers}`,
		);
	}

	if (settings.processVideos) {
		lines.push(
			`minVideoMb=${settings.minVideoMb}`,
			`videoPreset=${settings.videoPreset}`,
			`videoCrf=${settings.videoCrf}`,
			`videoMaxHeight=${videoHeight}`,
			`videosSmallFirst=${settings.videosSmallFirst ? 'yes' : 'no'}`,
			`videoScanAllFormats=${settings.videoScanAllFormats ? 'yes' : 'no'}`,
			`videoWorkers=${settings.videoWorkers}`,
		);
	}

	lines.push(
		`replaceFiles=${settings.replaceFiles ? 'yes' : 'no'}`,
		`stageToFastDisk=${settings.stageToFastDisk ? 'yes' : 'no'}`,
	);

	if (settings.stageToFastDisk) {
		lines.push(`stageDir=${settings.stageDir}`);
	}

	lines.push(`previousLogsPath=${previousLogs}`, '');

	return lines.join('\n');
};

export const createLogger = async (
	rootDir: string,
	settings: CompressSettings,
) => {
	const logPath = path.join(rootDir, makeLogFileName());
	const header = [
		'Batch Compressor log',
		`Started: ${new Date().toISOString()}`,
		'',
		formatSettingsBlock(settings),
		'=== FILES ===',
		'',
	].join('\n');

	await writeFile(logPath, header, 'utf8');

	const write = async (line: string): Promise<void> => {
		await appendFile(logPath, `${line}\n`, 'utf8');
	};

	const logResult = async (result: FileResult): Promise<void> => {
		const parts = [
			result.status.toUpperCase(),
			result.kind,
			result.path,
			`before=${result.bytesBefore} (${formatBytes(result.bytesBefore)})`,
			`after=${result.bytesAfter} (${formatBytes(result.bytesAfter)})`,
		];
		if (result.errorMessage) {
			parts.push(`error=${result.errorMessage}`);
		}

		await write(parts.join(' | '));
	};

	const writeSummary = async (
		summary: Omit<RunSummary, 'logPath' | 'results'> & {results?: FileResult[]},
	): Promise<string> => {
		const saved = summary.bytesBefore - summary.bytesAfter;
		const pct =
			summary.bytesBefore > 0 ? (saved / summary.bytesBefore) * 100 : 0;

		const block = [
			'',
			'=== SUMMARY ===',
			`found=${summary.found}`,
			`compressed=${summary.compressed}`,
			`skipSmall=${summary.skipSmall}`,
			`skipCompressed=${summary.skipCompressed}`,
			`skipPrevious=${summary.skipPrevious}`,
			`skipUser=${summary.skipUser}`,
			`skipLarger=${summary.skipLarger}`,
			`skipLowGain=${summary.skipLowGain}`,
			`errors=${summary.errors}`,
			`bytes=${formatBytes(summary.bytesBefore)} -> ${formatBytes(
				summary.bytesAfter,
			)} (saved ${pct.toFixed(1)}%)`,
			`elapsed=${formatDuration(summary.elapsedMs)}`,
			`durationTier=${summary.durationTier}`,
			`finished=${new Date().toISOString()}`,
			'',
		].join('\n');

		await write(block);
		return logPath;
	};

	return {logPath, write, logResult, writeSummary};
};

export type BuildSummarySkips = {
	skipSmall: number;
	skipCompressed: number;
	skipPrevious: number;
};

export const buildSummary = (
	results: FileResult[],
	skips: BuildSummarySkips,
	logPath: string,
	elapsedMs = 0,
): RunSummary => {
	const {
		skipSmall: skipSmallCount,
		skipCompressed: skipCompressedCount,
		skipPrevious: skipPreviousCount,
	} = skips;
	let compressed = 0;
	let skipLarger = 0;
	let skipLowGain = 0;
	let skipUser = 0;
	let errors = 0;
	let bytesBefore = 0;
	let bytesAfter = 0;

	for (const r of results) {
		bytesBefore += r.bytesBefore;
		if (r.status === 'ok') {
			compressed++;
			bytesAfter += r.bytesAfter;
		} else if (r.status === 'skip_larger') {
			skipLarger++;
			bytesAfter += r.bytesBefore;
		} else if (r.status === 'skip_low_gain') {
			skipLowGain++;
			bytesAfter += r.bytesBefore;
		} else if (r.status === 'skip_user') {
			skipUser++;
			bytesAfter += r.bytesBefore;
		} else if (r.status === 'error') {
			errors++;
			bytesAfter += r.bytesBefore;
		} else {
			bytesAfter += r.bytesBefore;
		}
	}

	return {
		found: results.length,
		compressed,
		skipSmall: skipSmallCount,
		skipCompressed: skipCompressedCount,
		skipPrevious: skipPreviousCount,
		skipLarger,
		skipLowGain,
		skipUser,
		errors,
		bytesBefore,
		bytesAfter,
		elapsedMs,
		durationTier: durationTier(elapsedMs),
		logPath,
		results,
	};
};
