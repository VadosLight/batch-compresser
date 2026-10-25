import {appendFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {formatBytes} from './i18n/ru.js';
import type {CompressSettings, FileResult, RunSummary} from './types.js';

const pad = (n: number): string => String(n).padStart(2, '0');

export const makeLogFileName = (date = new Date()): string => {
	const y = date.getFullYear();
	const m = pad(date.getMonth() + 1);
	const d = pad(date.getDate());
	const h = pad(date.getHours());
	const min = pad(date.getMinutes());
	const s = pad(date.getSeconds());
	return `batch-compresser-${y}${m}${d}-${h}${min}${s}.log`;
};

export const formatSettingsBlock = (settings: CompressSettings): string => {
	const photoMp =
		settings.megapixels === 0 ? 'без изменения' : `${settings.megapixels} Мп`;
	const videoHeight =
		settings.videoMaxHeight === 0 ? 'исходное' : `${settings.videoMaxHeight}p`;

	return [
		'=== ПАРАМЕТРЫ ===',
		`Папка: ${settings.rootDir}`,
		`Обрабатывать фото: ${settings.processPhotos ? 'да' : 'нет'}`,
		`Обрабатывать видео: ${settings.processVideos ? 'да' : 'нет'}`,
		`Мин. размер фото: ${settings.minPhotoMb} МБ`,
		`Мин. размер видео: ${settings.minVideoMb} МБ`,
		`Формат фото: ${settings.photoFormat}`,
		`Макс. разрешение фото: ${photoMp}`,
		`Пресет качества фото: ${settings.photoPreset}`,
		`Качество фото: ${settings.photoQuality}`,
		`Пресет качества видео: ${settings.videoPreset}`,
		`CRF видео: ${settings.videoCrf}`,
		`Макс. высота видео: ${videoHeight}`,
		`Режим вывода: ${
			settings.replaceFiles ? 'замена файлов' : 'рядом *_compressed'
		}`,
		`Воркеры фото: ${settings.photoWorkers}`,
		'',
	].join('\n');
};

export const createLogger = async (
	rootDir: string,
	settings: CompressSettings,
) => {
	const logPath = path.join(rootDir, makeLogFileName());
	const header = [
		'Batch Compresser log',
		`Started: ${new Date().toISOString()}`,
		'',
		formatSettingsBlock(settings),
		'=== ФАЙЛЫ ===',
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
			`before=${result.bytesBefore}`,
			`after=${result.bytesAfter}`,
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
			'=== СВОДКА ===',
			`Найдено к обработке: ${summary.found}`,
			`Сжато: ${summary.compressed}`,
			`Пропущено (маленькие): ${summary.skipSmall}`,
			`Пропущено (*_compressed): ${summary.skipCompressed}`,
			`Пропущено (результат больше): ${summary.skipLarger}`,
			`Ошибки: ${summary.errors}`,
			`Размер: ${formatBytes(summary.bytesBefore)} → ${formatBytes(
				summary.bytesAfter,
			)} (экономия ${pct.toFixed(1)}%)`,
			`Завершено: ${new Date().toISOString()}`,
			'',
		].join('\n');

		await write(block);
		return logPath;
	};

	return {logPath, write, logResult, writeSummary};
};

export const buildSummary = (
	results: FileResult[],
	skipSmallCount: number,
	skipCompressedCount: number,
	logPath: string,
): RunSummary => {
	let compressed = 0;
	let skipLarger = 0;
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
		skipLarger,
		errors,
		bytesBefore,
		bytesAfter,
		logPath,
		results,
	};
};
