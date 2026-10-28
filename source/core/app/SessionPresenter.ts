import {runCompression, type RunControls} from '../compress/run.js';
import {createDefaultSettings} from '../defaults.js';
import {loadProcessedPathsFromLogs} from '../fs/previous-logs.js';
import type {AppPorts} from '../ports/index.js';
import {scanDirectory} from '../scan.js';
import type {CompressSettings} from '../types.js';
import {nextWizardStep, prevWizardStep, type Screen} from '../wizard-nav.js';
import type {
	AppViewModel,
	ProgressSnapshot,
	ViewModelListener,
} from './view-model.js';

export type SessionPresenterOptions = {
	ports: AppPorts;
	initialPath?: string;
};

export class SessionPresenter {
	readonly #ports: AppPorts;
	#listeners = new Set<ViewModelListener>();
	#runControls: RunControls | undefined;
	#vm: AppViewModel;

	constructor(options: SessionPresenterOptions) {
		this.#ports = options.ports;
		const settings = createDefaultSettings(options.initialPath ?? '');
		this.#vm = {
			screen: 'boot',
			settings,
			pathDraft: options.initialPath ?? '',
			wizardStep: 1,
			ffmpeg: {available: true},
		};
	}

	getViewModel = (): AppViewModel => this.#vm;

	subscribe = (listener: ViewModelListener): (() => void) => {
		this.#listeners.add(listener);
		listener(this.#vm);
		return () => {
			this.#listeners.delete(listener);
		};
	};

	#emit = (patch: Partial<AppViewModel>): void => {
		this.#vm = {...this.#vm, ...patch};
		for (const listener of this.#listeners) {
			listener(this.#vm);
		}
	};

	#setScreen = (screen: Screen): void => {
		this.#emit({screen});
	};

	start = async (): Promise<void> => {
		const status = await this.#ports.ffmpeg.check();
		if (!status.available) {
			const plan = await this.#ports.process.detectInstallPlan();
			this.#emit({
				ffmpeg: {
					available: false,
					versionLine: status.versionLine,
					installPlan: plan,
				},
				settings: {...this.#vm.settings, processVideos: false},
				screen: 'ffmpegWarn',
			});
			return;
		}

		this.#emit({
			ffmpeg: {available: true, versionLine: status.versionLine},
			screen: 'wizard',
		});
	};

	continuePhotosOnly = (): void => {
		this.#emit({
			settings: {...this.#vm.settings, processVideos: false},
			ffmpeg: {
				...this.#vm.ffmpeg,
				available: false,
				installError: undefined,
			},
			screen: 'wizard',
		});
	};

	installFfmpeg = async (): Promise<void> => {
		const plan = this.#vm.ffmpeg.installPlan;
		if (!plan) {
			this.continuePhotosOnly();
			return;
		}

		this.#emit({
			ffmpeg: {...this.#vm.ffmpeg, installError: undefined},
			screen: 'ffmpegInstalling',
		});

		const result = await this.#ports.process.installFfmpeg(plan);
		if (!result.ok) {
			this.#emit({
				ffmpeg: {
					...this.#vm.ffmpeg,
					installError: result.errorMessage ?? 'install_failed',
				},
				screen: 'ffmpegInstallFail',
			});
			return;
		}

		const status = await this.#ports.ffmpeg.check();
		if (!status.available) {
			this.#emit({
				ffmpeg: {
					...this.#vm.ffmpeg,
					installError: 'ffmpeg_still_missing',
				},
				screen: 'ffmpegInstallFail',
			});
			return;
		}

		this.#emit({
			ffmpeg: {
				available: true,
				versionLine: status.versionLine,
				installPlan: plan,
			},
			settings: {...this.#vm.settings, processVideos: true},
			screen: 'wizard',
		});
	};

	setPathDraft = (pathDraft: string): void => {
		this.#emit({pathDraft});
	};

	patchSettings = (partial: Partial<CompressSettings>): void => {
		this.#emit({settings: {...this.#vm.settings, ...partial}});
	};

	wizardNext = (): void => {
		const ctx = {
			processPhotos: this.#vm.settings.processPhotos,
			processVideos: this.#vm.settings.processVideos,
			ffmpegAvailable: this.#vm.ffmpeg.available,
		};
		this.#emit({
			error: undefined,
			wizardStep: nextWizardStep(this.#vm.wizardStep, ctx),
		});
	};

	wizardBack = (): void => {
		const ctx = {
			processPhotos: this.#vm.settings.processPhotos,
			processVideos: this.#vm.settings.processVideos,
			ffmpegAvailable: this.#vm.ffmpeg.available,
		};
		this.#emit({
			error: undefined,
			wizardStep: prevWizardStep(this.#vm.wizardStep, ctx),
		});
	};

	finishWizard = async (): Promise<void> => {
		this.#emit({error: undefined});
		const {settings, ffmpeg} = this.#vm;

		if (!settings.rootDir) {
			this.#emit({error: 'path_empty', wizardStep: 1, screen: 'wizard'});
			return;
		}

		if (!settings.processPhotos && !settings.processVideos) {
			this.#emit({error: 'need_media_type', wizardStep: 2, screen: 'wizard'});
			return;
		}

		const next = {
			...settings,
			processVideos: settings.processVideos && ffmpeg.available,
		};
		this.#emit({settings: next, screen: 'scanning'});

		try {
			const {paths: processedPaths} = await loadProcessedPathsFromLogs(
				next.previousLogsPath,
			);
			const outcome = await scanDirectory(next, processedPaths);
			this.#emit({
				scan: {
					count: outcome.toProcess.length,
					skipSmall: outcome.skippedSmall.length,
					skipCompressed: outcome.skippedCompressed.length,
					skipPrevious: outcome.skippedPrevious.length,
				},
				screen: 'confirm',
			});
		} catch (error_) {
			this.#emit({
				error: error_ instanceof Error ? error_.message : String(error_),
				screen: 'wizard',
			});
		}
	};

	confirmCancel = (): void => {
		this.#setScreen('wizard');
	};

	confirmStart = async (): Promise<void> => {
		const scanCount = this.#vm.scan?.count ?? 0;
		this.#runControls = undefined;
		this.#emit({
			screen: 'running',
			openFolderError: undefined,
			progress: {
				done: 0,
				total: scanCount,
				current: '',
				activeJobs: [],
				bytesBefore: 0,
				bytesAfter: 0,
			},
		});

		try {
			const result = await runCompression(this.#vm.settings, {
				onControls: controls => {
					this.#runControls = controls;
				},
				onProgress: event => {
					const progress: ProgressSnapshot = {
						done: event.done,
						total: event.total,
						current: event.current,
						kind: event.kind,
						status: event.status,
						filePercent: event.filePercent,
						activeJobs: event.activeJobs,
						bytesBefore: event.bytesBefore,
						bytesAfter: event.bytesAfter,
						videoWorkers: event.videoWorkers,
						resourceAdvice: event.resourceAdvice,
					};
					this.#emit({progress});
				},
			});
			this.#runControls = undefined;
			this.#emit({summary: result, screen: 'summary'});
		} catch (error_) {
			this.#runControls = undefined;
			this.#emit({
				error: error_ instanceof Error ? error_.message : String(error_),
				screen: 'wizard',
			});
		}
	};

	skipVideo = (path: string): void => {
		this.#runControls?.skipVideo(path);
	};

	setVideoWorkers = (n: number): void => {
		this.#runControls?.setVideoWorkers(n);
	};

	openContainingFolder = async (filePath: string): Promise<void> => {
		this.#emit({openFolderError: undefined});
		try {
			await this.#ports.fs.openContainingFolder(filePath);
		} catch {
			this.#emit({openFolderError: 'open_folder_failed'});
		}
	};

	pickFolderForPath = async (): Promise<void> => {
		const result = await this.#ports.fs.pickFolder();
		if (!result.ok) {
			return;
		}

		const validation = await this.#ports.fs.validateDirectory(result.path);
		if (!validation.ok) {
			this.#emit({error: `path_${validation.reason}`});
			return;
		}

		this.#emit({
			pathDraft: validation.resolved,
			settings: {...this.#vm.settings, rootDir: validation.resolved},
			error: undefined,
		});
	};

	validateAndSetRootDir = async (draft: string): Promise<boolean> => {
		const validation = await this.#ports.fs.validateDirectory(draft);
		if (!validation.ok) {
			this.#emit({error: `path_${validation.reason}`});
			return false;
		}

		this.#emit({
			pathDraft: validation.resolved,
			settings: {...this.#vm.settings, rootDir: validation.resolved},
			error: undefined,
		});
		return true;
	};
}
