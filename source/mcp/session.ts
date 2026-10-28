import {SessionPresenter} from '../core/app/SessionPresenter.js';
import type {AppViewModel} from '../core/app/view-model.js';
import type {AppPorts} from '../core/ports/index.js';
import type {CompressSettings} from '../core/types.js';

export type McpSessionOptions = {
	ports: AppPorts;
	initialPath?: string;
};

/**
 * Headless session for MCP: Presenter + background compression run.
 */
export class McpSession {
	readonly presenter: SessionPresenter;
	#runPromise: Promise<void> | undefined;

	constructor(options: McpSessionOptions) {
		this.presenter = new SessionPresenter({
			ports: options.ports,
			initialPath: options.initialPath,
		});
	}

	getViewModel = (): AppViewModel => this.presenter.getViewModel();

	isCompressionRunning = (): boolean => this.#runPromise !== undefined;

	boot = async (): Promise<AppViewModel> => {
		await this.presenter.start();
		return this.getViewModel();
	};

	continuePhotosOnly = (): AppViewModel => {
		this.presenter.continuePhotosOnly();
		return this.getViewModel();
	};

	installFfmpeg = async (): Promise<AppViewModel> => {
		await this.presenter.installFfmpeg();
		return this.getViewModel();
	};

	configure = async (
		partial: Partial<CompressSettings>,
	): Promise<AppViewModel> => {
		const {rootDir, ...rest} = partial;
		if (rootDir !== undefined) {
			const ok = await this.presenter.validateAndSetRootDir(rootDir);
			if (!ok) {
				return this.getViewModel();
			}
		}

		if (Object.keys(rest).length > 0) {
			this.presenter.patchSettings(rest);
		}

		return this.getViewModel();
	};

	scan = async (): Promise<AppViewModel> => {
		await this.presenter.finishWizard();
		return this.getViewModel();
	};

	cancelConfirm = (): AppViewModel => {
		this.presenter.confirmCancel();
		return this.getViewModel();
	};

	/**
	 * Starts compression without blocking the MCP tool call until the run ends.
	 */
	startCompression = (): AppViewModel => {
		if (this.#runPromise) {
			throw new Error('compression_already_running');
		}

		const {screen} = this.getViewModel();
		if (screen !== 'confirm') {
			throw new Error(`cannot_start_from_screen_${screen}`);
		}

		this.#runPromise = this.presenter.confirmStart().finally(() => {
			this.#runPromise = undefined;
		});

		return this.getViewModel();
	};

	awaitCompletion = async (timeoutMs?: number): Promise<AppViewModel> => {
		const running = this.#runPromise;
		if (!running) {
			return this.getViewModel();
		}

		if (timeoutMs === undefined || timeoutMs <= 0) {
			await running;
			return this.getViewModel();
		}

		await Promise.race([
			running,
			new Promise<never>((_resolve, reject) => {
				setTimeout(() => {
					reject(new Error('await_timeout'));
				}, timeoutMs);
			}),
		]);

		return this.getViewModel();
	};

	skipVideo = (path: string): AppViewModel => {
		this.presenter.skipVideo(path);
		return this.getViewModel();
	};

	setVideoWorkers = (n: number): AppViewModel => {
		this.presenter.setVideoWorkers(n);
		return this.getViewModel();
	};

	openContainingFolder = async (filePath: string): Promise<AppViewModel> => {
		await this.presenter.openContainingFolder(filePath);
		return this.getViewModel();
	};
}
