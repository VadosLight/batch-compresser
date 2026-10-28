import type {DurationTier} from '../../core/duration.js';

export type UiLocale = 'ru' | 'en';

export type ByteUnits = {
	b: string;
	kb: string;
	mb: string;
	gb: string;
};

export type DurationUnits = {
	d: string;
	h: string;
	min: string;
	s: string;
};

export type Messages = {
	appTitle: string;
	ffmpegOk: string;
	ffmpegMissing: string;
	ffmpegOnlyPhotos: string;
	ffmpegInstallPrompt: (manager: string) => string;
	ffmpegInstallEnter: string;
	ffmpegInstallEsc: string;
	ffmpegInstallManual: string;
	ffmpegInstalling: string;
	ffmpegInstallFailed: string;
	ffmpegInstallRetry: string;
	ffmpegInstallOk: string;
	checkingFfmpeg: string;
	pathPrompt: string;
	pathNotSet: string;
	pathTypeManually: string;
	pathOpenExplorer: string;
	folderPickerOpen: string;
	folderPickerFailed: string;
	pathError: {
		empty: string;
		missing: string;
		notDirectory: string;
		unreadable: string;
	};
	processPhotos: string;
	processVideos: string;
	minPhotoMb: string;
	minVideoMb: string;
	photoFormat: string;
	formatSame: string;
	formatJpeg: string;
	formatWebp: string;
	megapixels: string;
	qualityPreset: string;
	photoQuality: string;
	videoCrf: string;
	videoHeight: string;
	videosSmallFirst: string;
	videosSmallFirstHint: string;
	videoScanAllFormats: string;
	videoScanAllFormatsHint: string;
	videoScanAllFormatsOn: string;
	videoScanAllFormatsOff: string;
	replaceFiles: string;
	photoWorkers: string;
	videoWorkers: string;
	workersHint: string;
	stageToFastDisk: string;
	stageDir: string;
	stageDirHint: string;
	stageHint: string;
	previousLogsPath: string;
	previousLogsHint: string;
	previousLogsOpenFolder: string;
	previousLogsOpenFile: string;
	previousLogsClear: string;
	previousLogsPickFolderPrompt: string;
	previousLogsPickFilePrompt: string;
	previousLogsError: {
		empty: string;
		missing: string;
		unreadable: string;
		notLogsPath: string;
	};
	videoStatusStage: string;
	next: string;
	back: string;
	nextArrow: string;
	backArrow: string;
	confirmTitle: string;
	confirmStart: string;
	confirmCancel: string;
	confirmFolder: (path: string) => string;
	confirmMode: (replace: boolean) => string;
	confirmPhoto: (parts: {
		minMb: number;
		mpLabel: string;
		quality: number;
	}) => string;
	confirmVideo: (parts: {
		minMb: number;
		crf: number;
		heightLabel: string;
		smallFirstSuffix: string;
		scanFormats: string;
	}) => string;
	confirmWorkers: (parts: string) => string;
	confirmStaging: (enabled: boolean, dir: string) => string;
	workerPhoto: (n: number) => string;
	workerVideo: (n: number) => string;
	mpUnlimited: string;
	mpUnchanged: string;
	heightSource: string;
	heightSourceShort: string;
	scanning: string;
	foundFiles: (n: number) => string;
	noFiles: string;
	progress: (done: number, total: number, current: string) => string;
	batchProgress: (done: number, total: number) => string;
	batchSaved: (
		before: number,
		after: number,
		saved: number,
		pct: number,
	) => string;
	activeJobs: string;
	skipHint: string;
	openFolderFailed: string;
	skipConfirm: (name: string) => string;
	videoWorkersLive: (n: number) => string;
	resourceLoad: (loadPerCore: number, cpuCount: number) => string;
	workerAdviceIncrease: string;
	workerAdviceDecrease: string;
	workerAdviceOk: string;
	fileStatus: string;
	processing: string;
	kindPhoto: string;
	kindVideo: string;
	photoStatusCompress: string;
	videoStatusProbe: string;
	videoStatusEncode: string;
	videoStatusFinalize: string;
	videoStatusDone: string;
	summaryTitle: string;
	celebrationTitle: Record<DurationTier, string>;
	celebrationSubtitle: (
		tier: string,
		compressed: number,
		elapsedLabel: string,
		savedLabel: string,
	) => string;
	summaryStats: (parts: {
		elapsedLabel: string;
		compressed: number;
		before: string;
		after: string;
		pct: number;
	}) => string;
	logPath: (p: string) => string;
	compressed: (n: number) => string;
	skipSmall: (n: number) => string;
	skipCompressed: (n: number) => string;
	skipPrevious: (n: number) => string;
	skipUser: (n: number) => string;
	skipLarger: (n: number) => string;
	skipLowGain: (n: number) => string;
	errors: (n: number) => string;
	bytes: (before: number, after: number, pct: number) => string;
	done: string;
	yes: string;
	no: string;
	on: string;
	off: string;
	step: (n: number, total: number, title: string) => string;
	needMediaType: string;
	wizardStepTitle: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string>;
	mediaSummary: (photo: string, video: string) => string;
	togglePhotoOn: string;
	togglePhotoOff: string;
	toggleVideoOn: string;
	toggleVideoOff: string;
	toggleVideoNoFfmpeg: string;
	thresholdPhoto: (mb: number) => string;
	thresholdVideo: (mb: number) => string;
	changeMinPhoto: string;
	changeMinVideo: string;
	photoSummary: (format: string, mpLabel: string, quality: number) => string;
	menuFormat: string;
	menuMp: string;
	menuQualityPreset: string;
	menuQualityNumber: string;
	customPreset: string;
	qualityHigh: string;
	qualityMedium: string;
	qualityLow: string;
	megapixelsUnchanged: string;
	megapixelsN: (n: number) => string;
	heightNp: (n: number) => string;
	videoSummary: (crf: number, heightLabel: string) => string;
	menuPreset: string;
	menuCrf: string;
	menuHeight: string;
	toggleSmallFirstOn: string;
	toggleSmallFirstOff: string;
	toggleScanAllOn: (label: string) => string;
	toggleScanAllOff: (label: string) => string;
	readyHint: string;
	goScan: string;
	enterValidateNext: string;
	enterSaveBack: string;
	outputToggleToSibling: string;
	outputToggleToReplace: string;
	outputPhotoWorkers: string;
	outputVideoWorkers: string;
	outputStagingOff: string;
	outputStagingOn: string;
	outputStageDir: string;
	outputPreviousLogs: string;
	pickFolderDefault: string;
	pickFileDefault: string;
	needZenityFolder: string;
	needZenityFile: string;
	zenityLogFilter: string;
	zenityAllFilter: string;
	cliHelp: string;
	byteUnits: ByteUnits;
	durationUnits: DurationUnits;
};
