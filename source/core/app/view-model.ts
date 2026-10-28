import type {ActiveJobProgress} from '../compress/run.js';
import type {ResourceAdvice} from '../compress/resource-advice.js';
import type {FfmpegInstallPlan} from '../ffmpeg-install.js';
import type {CompressSettings, MediaKind, RunSummary} from '../types.js';
import type {Screen} from '../wizard-nav.js';

export type ProgressSnapshot = {
	done: number;
	total: number;
	current: string;
	kind?: MediaKind;
	status?: string;
	filePercent?: number;
	activeJobs: ActiveJobProgress[];
	bytesBefore: number;
	bytesAfter: number;
	videoWorkers?: number;
	resourceAdvice?: ResourceAdvice;
};

export type ScanSnapshot = {
	count: number;
	skipSmall: number;
	skipCompressed: number;
	skipPrevious: number;
};

export type FfmpegSnapshot = {
	available: boolean;
	versionLine?: string;
	installPlan?: FfmpegInstallPlan;
	installError?: string;
};

export type AppViewModel = {
	screen: Screen;
	settings: CompressSettings;
	pathDraft: string;
	wizardStep: number;
	ffmpeg: FfmpegSnapshot;
	scan?: ScanSnapshot;
	progress?: ProgressSnapshot;
	summary?: RunSummary;
	error?: string;
	openFolderError?: string;
};

export type ViewModelListener = (vm: AppViewModel) => void;
