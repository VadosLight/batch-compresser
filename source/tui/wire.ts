import {SessionPresenter} from '../core/app/SessionPresenter.js';
import type {AppPorts} from '../core/ports/index.js';
import {createNodeFfmpegPort} from './adapters/node-ffmpeg-port.js';
import {createNodeFsPort} from './adapters/node-fs-port.js';
import {createNodeProcessPort} from './adapters/node-process-port.js';

export const createAppPorts = (): AppPorts => ({
	ffmpeg: createNodeFfmpegPort(),
	fs: createNodeFsPort(),
	process: createNodeProcessPort(),
});

export const createSessionPresenter = (
	initialPath?: string,
): SessionPresenter =>
	new SessionPresenter({
		ports: createAppPorts(),
		initialPath,
	});
