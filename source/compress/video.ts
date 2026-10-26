import path from 'node:path';
import {rm} from 'node:fs/promises';
import {execa} from 'execa';
import {probeVideo} from '../ffmpeg.js';
import type {CompressSettings, FileResult} from '../types.js';
import {parseProgressTimeSec, percentFromTime} from './ffmpeg-progress.js';
import {commitOutput, tempPathFor, videoMinSavingsRatio} from './write.js';

export type VideoProgressUpdate = {
	status: 'probe' | 'encode' | 'finalize';
	percent: number;
};

export type CompressVideoOptions = {
	/** Original path for size compare + final write (HDD). Defaults to workPath. */
	commitPath?: string;
	/** Called after encode finishes, before commit — e.g. delete staged input to free SSD. */
	onEncoded?: () => Promise<void>;
};

export const compressVideo = async (
	workPath: string,
	settings: Pick<
		CompressSettings,
		'videoCrf' | 'videoMaxHeight' | 'replaceFiles'
	>,
	onFileProgress?: (update: VideoProgressUpdate) => void,
	options: CompressVideoOptions = {},
): Promise<FileResult> => {
	const commitPath = options.commitPath ?? workPath;
	let tmp: string | undefined;

	try {
		onFileProgress?.({status: 'probe', percent: 0});
		const probe = await probeVideo(workPath);
		const durationSec =
			probe.durationSec && Number.isFinite(probe.durationSec)
				? probe.durationSec
				: 0;

		const crf = Math.min(51, Math.max(0, settings.videoCrf));
		const args = ['-y', '-hide_banner', '-i', workPath];

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
		tmp = tempPathFor(workPath, ext);
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
		await options.onEncoded?.();

		const replaceTarget = settings.replaceFiles
			? path.join(
					path.dirname(commitPath),
					`${path.basename(commitPath, path.extname(commitPath))}.mp4`,
			  )
			: undefined;

		return await commitOutput({
			sourcePath: commitPath,
			tempPath: tmp,
			kind: 'video',
			replaceFiles: settings.replaceFiles,
			outputExt: ext,
			replaceTargetPath: replaceTarget,
			minSavingsRatio: videoMinSavingsRatio,
		});
	} catch (error) {
		if (tmp) {
			await rm(tmp, {force: true}).catch(() => undefined);
		}

		return {
			path: commitPath,
			kind: 'video',
			status: 'error',
			bytesBefore: 0,
			bytesAfter: 0,
			errorMessage: error instanceof Error ? error.message : String(error),
		};
	}
};
