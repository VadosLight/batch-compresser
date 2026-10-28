import {execa} from 'execa';

export type FfmpegStatus = {
	available: boolean;
	versionLine?: string;
	error?: string;
};

export const checkFfmpeg = async (): Promise<FfmpegStatus> => {
	try {
		const {stdout, stderr} = await execa('ffmpeg', ['-version']);
		const line = (stdout || stderr).split('\n')[0]?.trim();
		return {available: true, versionLine: line};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {available: false, error: message};
	}
};

export type ProbeResult = {
	width: number;
	height: number;
	durationSec?: number;
};

export const probeVideo = async (filePath: string): Promise<ProbeResult> => {
	const {stdout} = await execa('ffprobe', [
		'-v',
		'error',
		'-select_streams',
		'v:0',
		'-show_entries',
		'stream=width,height',
		'-show_entries',
		'format=duration',
		'-of',
		'json',
		filePath,
	]);

	const data = JSON.parse(stdout) as {
		streams?: Array<{width?: number; height?: number}>;
		format?: {duration?: string};
	};

	const stream = data.streams?.[0];
	const width = stream?.width ?? 0;
	const height = stream?.height ?? 0;
	const durationRaw = data.format?.duration;
	const durationSec = durationRaw ? Number(durationRaw) : undefined;

	return {width, height, durationSec};
};
