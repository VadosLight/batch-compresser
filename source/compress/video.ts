import path from 'node:path';
import {execa} from 'execa';
import {probeVideo} from '../ffmpeg.js';
import type {CompressSettings, FileResult} from '../types.js';
import {parseProgressTimeSec, percentFromTime} from './ffmpeg-progress.js';
import {commitOutput, tempPathFor} from './write.js';

export type VideoProgressUpdate = {
	status: 'probe' | 'encode' | 'finalize';
	percent: number;
};

export const compressVideo = async (
	filePath: string,
	settings: Pick<
		CompressSettings,
		'videoCrf' | 'videoMaxHeight' | 'replaceFiles'
	>,
	onFileProgress?: (update: VideoProgressUpdate) => void,
): Promise<FileResult> => {
	try {
		onFileProgress?.({status: 'probe', percent: 0});
		const probe = await probeVideo(filePath);
		const durationSec =
			probe.durationSec && Number.isFinite(probe.durationSec)
				? probe.durationSec
				: 0;

		const crf = Math.min(51, Math.max(0, settings.videoCrf));
		const args = ['-y', '-hide_banner', '-i', filePath];

		const filters: string[] = [];
		if (settings.videoMaxHeight > 0 && probe.height > settings.videoMaxHeight) {
			filters.push(`scale=-2:${settings.videoMaxHeight}`);
		}

		if (filters.length > 0) {
			args.push('-vf', filters.join(','));
		}

		args.push(
			'-c:v',
			'libx264',
			'-crf',
			String(crf),
			'-preset',
			'medium',
			'-c:a',
			'aac',
			'-b:a',
			'128k',
			'-movflags',
			'+faststart',
			'-nostats',
			'-progress',
			'pipe:1',
		);

		const ext = '.mp4';
		const tmp = tempPathFor(filePath, ext);
		args.push(tmp);

		onFileProgress?.({status: 'encode', percent: 0});

		const subprocess = execa('ffmpeg', args);
		let lastPercent = 0;

		subprocess.stdout?.on('data', (chunk: Uint8Array) => {
			const timeSec = parseProgressTimeSec(new TextDecoder().decode(chunk));
			if (timeSec === undefined) {
				return;
			}

			const percent =
				durationSec > 0 ? percentFromTime(timeSec, durationSec) : lastPercent;
			if (percent !== lastPercent) {
				lastPercent = percent;
				onFileProgress?.({status: 'encode', percent});
			}
		});

		await subprocess;

		onFileProgress?.({status: 'finalize', percent: 100});

		const replaceTarget = settings.replaceFiles
			? path.join(
					path.dirname(filePath),
					`${path.basename(filePath, path.extname(filePath))}.mp4`,
			  )
			: undefined;

		return await commitOutput({
			sourcePath: filePath,
			tempPath: tmp,
			kind: 'video',
			replaceFiles: settings.replaceFiles,
			outputExt: ext,
			replaceTargetPath: replaceTarget,
		});
	} catch (error) {
		return {
			path: filePath,
			kind: 'video',
			status: 'error',
			bytesBefore: 0,
			bytesAfter: 0,
			errorMessage: error instanceof Error ? error.message : String(error),
		};
	}
};
