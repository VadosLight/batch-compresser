import {execa} from 'execa';
import {checkFfmpeg, probeVideo} from '../../core/ffmpeg.js';
import type {FfmpegPort} from '../../core/ports/ffmpeg-port.js';

export const createNodeFfmpegPort = (): FfmpegPort => ({
	check: checkFfmpeg,
	probeVideo,
	async listFormatsText() {
		try {
			const {stdout, stderr} = await execa('ffmpeg', [
				'-hide_banner',
				'-formats',
			]);
			return `${stdout}\n${stderr}`;
		} catch {
			return '';
		}
	},
});
