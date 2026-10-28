import {defaultStageDir} from './fs/stage.js';
import {defaultPhotoWorkers, defaultVideoWorkers} from './presets.js';
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
	videosSmallFirst: true,
	videoScanAllFormats: true,
	replaceFiles: false,
	photoWorkers: defaultPhotoWorkers(),
	videoWorkers: defaultVideoWorkers(),
	stageToFastDisk: false,
	stageDir: defaultStageDir(),
	previousLogsPath: '',
});
