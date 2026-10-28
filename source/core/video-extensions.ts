import {execa} from 'execa';

/** Conservative set used when «все форматы ffmpeg» выключен. */
export const CORE_VIDEO_EXTENSIONS: ReadonlySet<string> = new Set([
	'.mp4',
	'.mov',
	'.mkv',
	'.avi',
	'.webm',
	'.m4v',
	'.wmv',
	'.flv',
	'.mts',
	'.m2ts',
]);

/**
 * Broad container/elementary extensions ffmpeg commonly demuxes as video.
 * Used as the baseline for «все форматы» and merged with live `ffmpeg -formats`.
 */
export const ALL_VIDEO_EXTENSIONS: ReadonlySet<string> = new Set([
	...CORE_VIDEO_EXTENSIONS,
	'.mpg',
	'.mpeg',
	'.mpe',
	'.m1v',
	'.m2v',
	'.mpv',
	'.mp2',
	'.m2p',
	'.ps',
	'.vob',
	'.3gp',
	'.3g2',
	'.ts',
	'.m2t',
	'.tod',
	'.mod',
	'.mqv',
	'.asf',
	'.wm',
	'.ogv',
	'.ogm',
	'.divx',
	'.xvid',
	'.f4v',
	'.f4p',
	'.mxf',
	'.nut',
	'.dv',
	'.dif',
	'.nsv',
	'.amv',
	'.bik',
	'.smk',
	'.wtv',
	'.dvr-ms',
	'.y4m',
	'.ivf',
	'.lxf',
	'.gxf',
	'.r3d',
	'.rm',
	'.rmvb',
	'.hevc',
	'.h265',
	'.h264',
	'.264',
	'.265',
	'.avs',
	'.avs2',
	'.vpy',
	'.vro',
	'.rec',
	'.dat',
	'.trp',
	'.tp',
]);

/** Demuxer / format name → file extensions (when name alone is not an ext). */
const FORMAT_NAME_TO_EXTS: Readonly<Record<string, readonly string[]>> = {
	'3gp': ['.3gp'],
	'3g2': ['.3g2'],
	asf: ['.asf', '.wmv', '.wma'],
	avi: ['.avi'],
	avs: ['.avs'],
	avs2: ['.avs2'],
	bink: ['.bik'],
	dash: [],
	dv: ['.dv', '.dif'],
	f4v: ['.f4v'],
	film_cpk: [],
	flv: ['.flv'],
	gxf: ['.gxf'],
	h264: ['.h264', '.264'],
	hevc: ['.hevc', '.h265', '.265'],
	hls: [],
	iff: [],
	image2: [],
	ivf: ['.ivf'],
	lxf: ['.lxf'],
	matroska: ['.mkv', '.mka', '.webm'],
	webm: ['.webm'],
	mov: ['.mov', '.mp4', '.m4v', '.3gp', '.3g2', '.mj2'],
	mp4: ['.mp4', '.m4v', '.m4a'],
	mpeg: ['.mpg', '.mpeg', '.mpe', '.m2v', '.vob'],
	mpegts: ['.ts', '.m2ts', '.mts', '.m2t', '.trp', '.tp'],
	mpegps: ['.mpg', '.mpeg', '.ps', '.vob', '.dat'],
	mxf: ['.mxf'],
	nsv: ['.nsv'],
	nut: ['.nut'],
	ogg: ['.ogv', '.ogm'],
	rawvideo: [],
	rm: ['.rm', '.rmvb'],
	svag: [],
	swf: ['.swf'],
	v210: [],
	vivo: ['.viv'],
	vobsub: [],
	wc3movie: [],
	webm_dash_manifest: [],
	wtv: ['.wtv'],
	yuv4mpegpipe: ['.y4m'],
};

/** Audio-only extensions to drop even if a demuxer advertises them. */
const AUDIO_ONLY_EXT = new Set([
	'.m4a',
	'.mka',
	'.wma',
	'.mp3',
	'.aac',
	'.flac',
	'.wav',
	'.opus',
	'.oga',
	'.ac3',
	'.eac3',
]);

const normalizeExt = (value: string): string | undefined => {
	const raw = value.trim().toLowerCase();
	if (!raw) {
		return undefined;
	}

	const withDot = raw.startsWith('.') ? raw : `.${raw}`;
	if (AUDIO_ONLY_EXT.has(withDot)) {
		return undefined;
	}

	if (!/^\.[a-z\d]{1,8}$/.test(withDot)) {
		return undefined;
	}

	return withDot;
};

const extensionsForFormatName = (name: string): string[] => {
	const key = name.toLowerCase();
	const mapped = FORMAT_NAME_TO_EXTS[key];
	if (mapped) {
		const exts: string[] = [];
		for (const ext of mapped) {
			const normalized = normalizeExt(ext);
			if (normalized) {
				exts.push(normalized);
			}
		}

		return exts;
	}

	const asExt = normalizeExt(key);
	return asExt ? [asExt] : [];
};

/**
 * Parse `ffmpeg -formats` demuxer lines into video-oriented extensions.
 * Returns empty set if ffmpeg is unavailable.
 */
export const probeFfmpegVideoExtensions = async (): Promise<Set<string>> => {
	const found = new Set<string>();
	try {
		const {stdout, stderr} = await execa('ffmpeg', [
			'-hide_banner',
			'-formats',
		]);
		const text = `${stdout}\n${stderr}`;
		for (const line of text.split('\n')) {
			// " D. name  description" or " DE name  description"
			const match = /^\s*D[E.]?\s+(\S+)/.exec(line);
			if (!match?.[1]) {
				continue;
			}

			for (const part of match[1].split(',')) {
				for (const ext of extensionsForFormatName(part)) {
					found.add(ext);
				}
			}
		}
	} catch {
		return found;
	}

	return found;
};

export const resolveVideoExtensions = async (
	scanAllFormats: boolean,
): Promise<ReadonlySet<string>> => {
	if (!scanAllFormats) {
		return CORE_VIDEO_EXTENSIONS;
	}

	const fromFfmpeg = await probeFfmpegVideoExtensions();
	return new Set([...ALL_VIDEO_EXTENSIONS, ...fromFfmpeg]);
};
