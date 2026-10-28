import {formatBytesWith} from './format-bytes.js';
import type {Messages} from './types.js';

const byteUnits = {
	b: 'B',
	kb: 'KB',
	mb: 'MB',
	gb: 'GB',
} as const;

const fb = (n: number): string => formatBytesWith(n, byteUnits);

export const en: Messages = {
	appTitle: 'Batch Compressor — batch photo & video compression',
	ffmpegOk: 'ffmpeg found',
	ffmpegMissing: 'ffmpeg was not found in PATH.',
	ffmpegOnlyPhotos: 'Continue with photos only',
	ffmpegInstallPrompt: (manager: string) => `Install via ${manager}?`,
	ffmpegInstallEnter: 'Enter — install',
	ffmpegInstallEsc: 'Esc — photos only',
	ffmpegInstallManual:
		'Install manually: brew / apt / winget / choco install ffmpeg',
	ffmpegInstalling: 'Installing ffmpeg…',
	ffmpegInstallFailed: 'Failed to install ffmpeg.',
	ffmpegInstallRetry: 'Enter — retry · Esc — photos only',
	ffmpegInstallOk: 'ffmpeg installed',
	checkingFfmpeg: 'Checking ffmpeg…',
	pathPrompt: 'Folder path',
	pathNotSet: '(not set)',
	pathTypeManually: 'Type path manually',
	pathOpenExplorer: 'Open folder picker…',
	folderPickerOpen: 'Opening folder picker…',
	folderPickerFailed: 'Could not open folder picker',
	pathError: {
		empty: 'Enter a folder path',
		missing: 'Folder does not exist or is unavailable',
		notDirectory: 'Path is not a folder',
		unreadable: 'No access to the folder',
	},
	processPhotos: 'Process photos',
	processVideos: 'Process videos',
	minPhotoMb: 'Min photo size (MB, 0 = off)',
	minVideoMb: 'Min video size (MB, 0 = off)',
	photoFormat: 'Photo format',
	formatSame: 'Same as source',
	formatJpeg: 'JPEG',
	formatWebp: 'WebP',
	megapixels: 'Max resolution (MP)',
	qualityPreset: 'Quality preset',
	photoQuality: 'Photo quality (1–100)',
	videoCrf: 'Video CRF (lower = better)',
	videoHeight: 'Max video height',
	videosSmallFirst: 'Smaller videos first',
	videosSmallFirstHint: 'Queue by ascending size — progress appears sooner',
	videoScanAllFormats: 'Scan all ffmpeg formats',
	videoScanAllFormatsHint:
		'Extensions from ffmpeg demuxers + full container list; otherwise common ones only',
	videoScanAllFormatsOn: 'All ffmpeg formats',
	videoScanAllFormatsOff: 'Common only (mp4/mov/mkv/…)',
	replaceFiles: 'Replace files in place (otherwise sibling *_compressed)',
	photoWorkers: 'Parallel photo workers',
	videoWorkers: 'Parallel video workers',
	workersHint:
		'For thousands of videos raise workers (watch CPU/disk; on HDD prefer 1–2)',
	stageToFastDisk: 'Stage to fast disk (HDD→tmp→encode→back)',
	stageDir: 'Staging folder (preferably SSD)',
	stageDirHint: 'E.g. /tmp or a path on SSD',
	stageHint:
		'If files are on HDD + you have SSD: enable staging and raise video workers',
	previousLogsPath: 'Previous logs (skip already processed)',
	previousLogsHint: 'A .log file or folder of logs; empty path — no skip',
	previousLogsOpenFolder: 'Pick logs folder…',
	previousLogsOpenFile: 'Pick log file…',
	previousLogsClear: 'Clear path',
	previousLogsPickFolderPrompt: 'Select folder with previous logs',
	previousLogsPickFilePrompt: 'Select previous log file',
	previousLogsError: {
		empty: 'Enter a logs path',
		missing: 'Previous logs path does not exist',
		unreadable: 'No access to previous logs',
		notLogsPath: 'Logs path must be a file or folder',
	},
	videoStatusStage: 'Copying to fast disk',
	next: 'Next',
	back: 'Back (Esc)',
	nextArrow: '→ Next',
	backArrow: '← Back',
	confirmTitle: 'Confirm run',
	confirmStart: 'Enter — start',
	confirmCancel: 'Esc — back to settings',
	confirmFolder: (path: string) => `Folder: ${path}`,
	confirmMode: (replace: boolean) =>
		`Mode: ${replace ? 'replace files' : 'sibling *_compressed'}`,
	confirmPhoto: ({minMb, mpLabel, quality}) =>
		`Photos: min ${minMb} MB, ${mpLabel} MP, q=${quality}`,
	confirmVideo: ({minMb, crf, heightLabel, smallFirstSuffix, scanFormats}) =>
		`Videos: min ${minMb} MB, CRF=${crf}, height=${heightLabel}${smallFirstSuffix}, ${scanFormats}`,
	confirmWorkers: (parts: string) => `Workers: ${parts}`,
	confirmStaging: (enabled: boolean, dir: string) =>
		`Staging: ${enabled ? 'Yes' : 'No'}${enabled ? ` → ${dir}` : ''}`,
	workerPhoto: (n: number) => `photos ${n}`,
	workerVideo: (n: number) => `videos ${n}`,
	mpUnlimited: '∞',
	mpUnchanged: 'unchanged',
	heightSource: 'source',
	heightSourceShort: 'src',
	scanning: 'Scanning…',
	foundFiles: (n: number) => `Files to process: ${n}`,
	noFiles: 'No files match the filters.',
	progress: (done: number, total: number, current: string) =>
		`Processed ${done}/${total}: ${current}`,
	batchProgress: (done: number, total: number) => `Done ${done}/${total}`,
	batchSaved: (before: number, after: number, saved: number, pct: number) =>
		`saved ${fb(saved)} (${fb(before)} → ${fb(after)}, −${pct.toFixed(1)}%)`,
	activeJobs: 'Active jobs',
	skipHint: '↑↓ select · s skip · [ ] workers · o folder',
	openFolderFailed: 'Could not open folder',
	skipConfirm: (name: string) => `Skip ${name}? Enter — yes · Esc — no`,
	videoWorkersLive: (n: number) => `Video workers: ${n}`,
	resourceLoad: (loadPerCore: number, cpuCount: number) =>
		`load ${loadPerCore.toFixed(2)}× (${cpuCount})`,
	workerAdviceIncrease: 'advice: increase',
	workerAdviceDecrease: 'advice: decrease',
	workerAdviceOk: 'advice: ok',
	fileStatus: 'Status',
	processing: 'Processing…',
	kindPhoto: 'photo',
	kindVideo: 'video',
	photoStatusCompress: 'Compressing photo',
	videoStatusProbe: 'Probing video (ffprobe)',
	videoStatusEncode: 'Encoding H.264',
	videoStatusFinalize: 'Writing result',
	videoStatusDone: 'Done',
	summaryTitle: 'Summary',
	celebrationTitle: {
		quick: 'Quick and clean',
		standard: 'Done!',
		long: 'Long session complete',
		marathon: 'Almost a full day at the bench — well earned rest',
		epic: 'You finished the marathon!',
	},
	celebrationSubtitle: (
		_tier: string,
		compressed: number,
		elapsedLabel: string,
		savedLabel: string,
	) => `${compressed} compressed in ${elapsedLabel} · freed ${savedLabel}`,
	summaryStats: (parts: {
		elapsedLabel: string;
		compressed: number;
		before: string;
		after: string;
		pct: number;
	}) =>
		`${parts.elapsedLabel} · compressed ${parts.compressed} · ${
			parts.before
		} → ${parts.after} (−${parts.pct.toFixed(1)}%)`,
	logPath: (p: string) => `Log: ${p}`,
	compressed: (n: number) => `Compressed: ${n}`,
	skipSmall: (n: number) => `Skipped (too small): ${n}`,
	skipCompressed: (n: number) => `Skipped (*_compressed): ${n}`,
	skipPrevious: (n: number) => `Skipped (already in logs): ${n}`,
	skipUser: (n: number) => `Skipped (user): ${n}`,
	skipLarger: (n: number) => `Skipped (result larger): ${n}`,
	skipLowGain: (n: number) => `Skipped (savings < 3%): ${n}`,
	errors: (n: number) => `Errors: ${n}`,
	bytes: (before: number, after: number, pct: number) =>
		`Size: ${fb(before)} → ${fb(after)} (saved ${pct.toFixed(1)}%)`,
	done: 'Done. Press Ctrl+C to exit.',
	yes: 'Yes',
	no: 'No',
	on: 'on',
	off: 'off',
	step: (n: number, total: number, title: string) =>
		`Step ${n}/${total}: ${title}`,
	needMediaType: 'Enable at least photos or videos',
	wizardStepTitle: {
		1: 'Folder',
		2: 'Media types',
		3: 'Size thresholds',
		4: 'Photo settings',
		5: 'Video settings',
		6: 'Output, workers & logs',
		7: 'Ready to scan',
	},
	mediaSummary: (photo: string, video: string) =>
		`Photos: ${photo} · Videos: ${video}`,
	togglePhotoOn: 'Enable photos',
	togglePhotoOff: 'Disable photos',
	toggleVideoOn: 'Enable videos',
	toggleVideoOff: 'Disable videos',
	toggleVideoNoFfmpeg: 'Enable videos (no ffmpeg)',
	thresholdPhoto: (mb: number) => `Photos ≥ ${mb} MB`,
	thresholdVideo: (mb: number) => `Videos ≥ ${mb} MB`,
	changeMinPhoto: 'Change min photo size',
	changeMinVideo: 'Change min video size',
	photoSummary: (format: string, mpLabel: string, quality: number) =>
		`Format: ${format}, MP: ${mpLabel}, quality: ${quality}`,
	menuFormat: 'Format',
	menuMp: 'Megapixels',
	menuQualityPreset: 'Quality preset',
	menuQualityNumber: 'Quality number',
	customPreset: 'Custom',
	qualityHigh: 'High',
	qualityMedium: 'Medium',
	qualityLow: 'Low',
	megapixelsUnchanged: 'Unchanged',
	megapixelsN: (n: number) => `${n} MP`,
	heightNp: (n: number) => `${n}p`,
	videoSummary: (crf: number, heightLabel: string) =>
		`CRF: ${crf}, height: ${heightLabel}`,
	menuPreset: 'Preset',
	menuCrf: 'CRF number',
	menuHeight: 'Max height',
	toggleSmallFirstOn: 'Enable “smaller first”',
	toggleSmallFirstOff: 'Disable “smaller first”',
	toggleScanAllOn: (label: string) => `Enable “${label}”`,
	toggleScanAllOff: (label: string) => `Disable “${label}”`,
	readyHint: 'Review settings and start scanning.',
	goScan: 'Scan and confirm',
	enterValidateNext: 'Enter — validate & continue · Esc — menu',
	enterSaveBack: 'Enter — save · Esc — back',
	outputToggleToSibling: 'Switch to sibling *_compressed',
	outputToggleToReplace: 'Switch to full replace',
	outputPhotoWorkers: 'Photo workers',
	outputVideoWorkers: 'Video workers',
	outputStagingOff: 'Disable fast-disk staging',
	outputStagingOn: 'Enable staging (HDD→SSD tmp)',
	outputStageDir: 'Staging folder path',
	outputPreviousLogs: 'Previous logs path',
	pickFolderDefault: 'Select a folder to compress',
	pickFileDefault: 'Select a log file',
	needZenityFolder: 'Install zenity or kdialog to pick a folder',
	needZenityFile: 'Install zenity or kdialog to pick a file',
	zenityLogFilter: 'Logs (*.log) | *.log',
	zenityAllFilter: 'All files | *',
	cliHelp: `
	Usage
	  $ batch-compressor

	Options
	  --path, -p  Initial folder path

	Examples
	  $ batch-compressor
	  $ batch-compressor --path ~/Pictures
`,
	byteUnits,
	durationUnits: {
		d: 'd',
		h: 'h',
		min: 'm',
		s: 's',
	},
};
