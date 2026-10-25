import {defaultPhotoWorkers} from './presets.js';
import type {CompressSettings} from './types.js';

export const createDefaultSettings = (rootDir = ''): CompressSettings => ({
	rootDir,
	processPhotos: true,
	processVideos: true,
	minPhotoMb: 0.5,
	minVideoMb: 5,
	photoFormat: 'same',
	megapixels: 0,
	photoQuality: 80,
	photoPreset: 'medium',
	videoCrf: 23,
	videoPreset: 'medium',
	videoMaxHeight: 0,
	replaceFiles: false,
	photoWorkers: defaultPhotoWorkers(),
});
