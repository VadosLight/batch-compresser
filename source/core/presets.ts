import {cpus} from 'node:os';
import type {QualityPresetId} from './types.js';

export type QualityPreset = {
	id: QualityPresetId;
	label: string;
	photoQuality: number;
	videoCrf: number;
};

/** Labels are English fallbacks; TUI localizes via i18n by `id`. */
export const qualityPresets: readonly QualityPreset[] = [
	{id: 'high', label: 'High', photoQuality: 90, videoCrf: 18},
	{id: 'medium', label: 'Medium', photoQuality: 80, videoCrf: 23},
	{id: 'low', label: 'Low', photoQuality: 60, videoCrf: 28},
] as const;

export const getPreset = (id: QualityPresetId): QualityPreset | undefined =>
	qualityPresets.find(p => p.id === id);

export const defaultPhotoWorkers = (): number => Math.max(1, cpus().length - 1);

/** Conservative default for heavy ffmpeg jobs; raise in TUI for bulk runs. */
export const defaultVideoWorkers = (): number => {
	const half = Math.floor(cpus().length / 2);
	return Math.max(1, Math.min(4, half || 1));
};

/** Runtime upper bound for video workers (one heavy encode per core). */
export const maxVideoWorkers = (): number => Math.max(1, cpus().length);

export const megapixelChoices: ReadonlyArray<{
	value: 0 | 1 | 2 | 4 | 8 | 12;
	label: string;
}> = [
	{value: 0, label: 'Unchanged'},
	{value: 12, label: '12 MP'},
	{value: 8, label: '8 MP'},
	{value: 4, label: '4 MP'},
	{value: 2, label: '2 MP'},
	{value: 1, label: '1 MP'},
];

export const videoHeightChoices: ReadonlyArray<{
	value: 0 | 480 | 720 | 1080;
	label: string;
}> = [
	{value: 0, label: 'Source'},
	{value: 1080, label: '1080p'},
	{value: 720, label: '720p'},
	{value: 480, label: '480p'},
];

/** Target pixel count for megapixel cap; undefined if no resize. */
export const targetPixelsForMp = (mp: number): number | undefined =>
	mp > 0 ? mp * 1_000_000 : undefined;

/**
 * Scale dimensions so width*height <= targetPixels, preserving aspect ratio.
 * Returns undefined if no downscale needed.
 */
export const scaledSize = (
	width: number,
	height: number,
	targetPixels: number,
): {width: number; height: number} | undefined => {
	const current = width * height;
	if (current <= targetPixels || width <= 0 || height <= 0) {
		return undefined;
	}

	const scale = Math.sqrt(targetPixels / current);
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
};

export const mbToBytes = (mb: number): number => Math.round(mb * 1024 * 1024);

export const isBelowMinSize = (sizeBytes: number, minMb: number): boolean => {
	if (minMb <= 0) {
		return false;
	}

	return sizeBytes < mbToBytes(minMb);
};

export const compressedSiblingPath = (
	filePath: string,
	newExt?: string,
): string => {
	const lastSlash = Math.max(
		filePath.lastIndexOf('/'),
		filePath.lastIndexOf('\\'),
	);
	const dir = lastSlash >= 0 ? filePath.slice(0, lastSlash + 1) : '';
	const base = lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath;
	const dot = base.lastIndexOf('.');
	const name = dot > 0 ? base.slice(0, dot) : base;
	const ext = newExt ?? (dot > 0 ? base.slice(dot) : '');
	return `${dir}${name}_compressed${ext}`;
};

export const isCompressedName = (filePath: string): boolean => {
	const base = filePath.split(/[/\\]/).pop() ?? filePath;
	const dot = base.lastIndexOf('.');
	const name = dot > 0 ? base.slice(0, dot) : base;
	return name.endsWith('_compressed');
};
