export type MediaKind = 'photo' | 'video';

export type PhotoFormatMode = 'same' | 'jpeg' | 'webp';

export type MegapixelOption = 0 | 1 | 2 | 4 | 8 | 12;

export type VideoMaxHeight = 0 | 480 | 720 | 1080;

export type QualityPresetId = 'high' | 'medium' | 'low' | 'custom';

export type FileStatus =
	| 'ok'
	| 'skip_small'
	| 'skip_compressed'
	| 'skip_larger'
	| 'skip_low_gain'
	| 'error';

export type CompressSettings = {
	rootDir: string;
	processPhotos: boolean;
	processVideos: boolean;
	minPhotoMb: number;
	minVideoMb: number;
	photoFormat: PhotoFormatMode;
	megapixels: MegapixelOption;
	photoQuality: number;
	photoPreset: QualityPresetId;
	videoCrf: number;
	videoPreset: QualityPresetId;
	videoMaxHeight: VideoMaxHeight;
	replaceFiles: boolean;
	photoWorkers: number;
	videoWorkers: number;
	/** Copy source to fast disk (SSD tmp) before encode, then write result back. */
	stageToFastDisk: boolean;
	/** Root for staging sessions; default is OS tmpdir/batch-compresser. */
	stageDir: string;
};

export type ScannedFile = {
	path: string;
	kind: MediaKind;
	sizeBytes: number;
};

export type FileResult = {
	path: string;
	kind: MediaKind;
	status: FileStatus;
	bytesBefore: number;
	bytesAfter: number;
	errorMessage?: string;
};

export type RunSummary = {
	found: number;
	compressed: number;
	skipSmall: number;
	skipCompressed: number;
	skipLarger: number;
	skipLowGain: number;
	errors: number;
	bytesBefore: number;
	bytesAfter: number;
	logPath: string;
	results: FileResult[];
};
