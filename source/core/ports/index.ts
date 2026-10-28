import type {FfmpegPort} from './ffmpeg-port.js';
import type {FsPort} from './fs-port.js';
import type {ProcessPort} from './process-port.js';

export type {FfmpegPort} from './ffmpeg-port.js';
export type {FsPort, PickPathResult} from './fs-port.js';
export type {ProcessPort} from './process-port.js';

export type AppPorts = {
	ffmpeg: FfmpegPort;
	fs: FsPort;
	process: ProcessPort;
};
