export type ConcurrencyLimiterOptions = {
	/** Upper bound for setConcurrency; default unlimited (Number.MAX_SAFE_INTEGER). */
	max?: number;
};

export type ConcurrencyLimiter = {
	run: <T>(fn: () => PromiseLike<T> | T) => Promise<T>;
	readonly activeCount: number;
	readonly pendingCount: number;
	getConcurrency: () => number;
	setConcurrency: (n: number) => void;
};

export const createConcurrencyLimiter = (
	initial: number,
	options: ConcurrencyLimiterOptions = {},
): ConcurrencyLimiter => {
	const max = Math.max(1, options.max ?? Number.MAX_SAFE_INTEGER);
	let concurrency = Math.min(max, Math.max(1, Math.floor(initial)));
	let activeCount = 0;
	const queue: Array<() => void> = [];

	const pump = (): void => {
		while (activeCount < concurrency && queue.length > 0) {
			const next = queue.shift();
			if (!next) {
				break;
			}

			activeCount++;
			next();
		}
	};

	const run = async <T>(fn: () => PromiseLike<T> | T): Promise<T> =>
		new Promise<T>((resolve, reject) => {
			const start = (): void => {
				Promise.resolve()
					.then(fn)
					.then(resolve, reject)
					.finally(() => {
						activeCount--;
						pump();
					});
			};

			queue.push(start);
			pump();
		});

	return {
		run,
		get activeCount() {
			return activeCount;
		},
		get pendingCount() {
			return queue.length;
		},
		getConcurrency: () => concurrency,
		setConcurrency(n: number) {
			concurrency = Math.min(max, Math.max(1, Math.floor(n)));
			pump();
		},
	};
};
