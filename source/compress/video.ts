import path from 'node:path';
import {execa} from 'execa';
import {probeVideo} from '../ffmpeg.js';
import type {CompressSettings, FileResult} from '../types.js';
import {commitOutput, tempPathFor} from './write.js';

export const compressVideo = async (
	filePath: string,
	settings: Pick<
		CompressSettings,
		'videoCrf' | 'videoMaxHeight' | 'replaceFiles'
	>,
): Promise<FileResult> => {
	try {
		const probe = await probeVideo(filePath);
		const crf = Math.min(51, Math.max(0, settings.videoCrf));
		const args = ['-y', '-i', filePath];

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
		);

		const ext = '.mp4';
		const tmp = tempPathFor(filePath, ext);
		args.push(tmp);

		await execa('ffmpeg', args);

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
