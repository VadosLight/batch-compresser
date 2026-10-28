import {cpus, freemem, loadavg, totalmem} from 'node:os';
import process from 'node:process';
import {maxVideoWorkers} from '../presets.js';

export type WorkerAdvice = 'increase' | 'decrease' | 'ok';

export type ResourceAdvice = {
	/** Raw 1-minute load average (system-wide runnable count). */
	load1: number;
	cpuCount: number;
	/**
	 * Per-core load: `load1 / cpuCount`.
	 * Unix/macOS loadavg sums work across cores — 1.0 ≈ all cores busy.
	 */
	loadPerCore: number;
	freeMemRatio: number;
	videoWorkers: number;
	advice: WorkerAdvice;
};

export type ResourceAdviceInput = {
	videoWorkers: number;
	maxWorkers?: number;
	pendingCount?: number;
	load1?: number;
	cpuCount?: number;
	freeMemRatio?: number;
	/** False when OS does not provide meaningful loadavg (e.g. Windows zeros). */
	loadAvailable?: boolean;
};

export const sampleResourceAdvice = (
	input: ResourceAdviceInput,
): ResourceAdvice => {
	const cpuCount = Math.max(1, input.cpuCount ?? cpus().length);
	const load1 = input.load1 ?? loadavg()[0] ?? 0;
	const loadPerCore = load1 / cpuCount;
	const freeMemRatio =
		input.freeMemRatio ?? (totalmem() > 0 ? freemem() / totalmem() : 1);
	const videoWorkers = Math.max(1, input.videoWorkers);
	const maxWorkers = Math.max(1, input.maxWorkers ?? maxVideoWorkers());
	const pendingCount = Math.max(0, input.pendingCount ?? 0);
	const loadAvailable =
		input.loadAvailable ?? !(load1 === 0 && process.platform === 'win32');

	let advice: WorkerAdvice = 'ok';

	if (videoWorkers > 1 && freeMemRatio < 0.1) {
		advice = 'decrease';
	} else if (loadAvailable && videoWorkers > 1 && loadPerCore >= 0.85) {
		advice = 'decrease';
	} else if (
		loadAvailable &&
		videoWorkers < maxWorkers &&
		pendingCount > 0 &&
		loadPerCore <= 0.45
	) {
		advice = 'increase';
	}

	return {
		load1,
		cpuCount,
		loadPerCore,
		freeMemRatio,
		videoWorkers,
		advice,
	};
};
