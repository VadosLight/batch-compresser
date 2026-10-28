import type {FfmpegStatus, ProbeResult} from '../ffmpeg.js';

export type FfmpegPort = {
	check: () => Promise<FfmpegStatus>;
	probeVideo: (filePath: string) => Promise<ProbeResult>;
	/** Raw stdout of `ffmpeg -formats` (empty string if unavailable). */
	listFormatsText: () => Promise<string>;
};
