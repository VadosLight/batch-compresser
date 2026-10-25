/** Parse ffmpeg `-progress` key=value lines; returns time in seconds if present. */
export const parseProgressTimeSec = (chunk: string): number | undefined => {
	const lines = chunk.split(/\r?\n/);
	let outTimeMs: number | undefined;
	let outTimeUs: number | undefined;
	let outTime: string | undefined;

	for (const line of lines) {
		const eq = line.indexOf('=');
		if (eq <= 0) {
			continue;
		}

		const key = line.slice(0, eq).trim();
		const value = line.slice(eq + 1).trim();
		if (key === 'out_time_ms') {
			const n = Number(value);
			if (Number.isFinite(n)) {
				outTimeMs = n;
			}
		} else if (key === 'out_time_us') {
			const n = Number(value);
			if (Number.isFinite(n)) {
				outTimeUs = n;
			}
		} else if (key === 'out_time') {
			outTime = value;
		}
	}

	if (outTimeUs !== undefined) {
		return outTimeUs / 1_000_000;
	}

	if (outTimeMs !== undefined) {
		// Some builds report microseconds in out_time_ms
		return outTimeMs > 10_000_000 ? outTimeMs / 1_000_000 : outTimeMs / 1000;
	}

	if (outTime && outTime !== 'N/A') {
		return parseHhMmSs(outTime);
	}

	return undefined;
};

export const parseHhMmSs = (value: string): number | undefined => {
	const parts = value.split(':');
	if (parts.length !== 3) {
		return undefined;
	}

	const hours = Number(parts[0]);
	const minutes = Number(parts[1]);
	const seconds = Number(parts[2]);
	if (
		!Number.isFinite(hours) ||
		!Number.isFinite(minutes) ||
		!Number.isFinite(seconds)
	) {
		return undefined;
	}

	return hours * 3600 + minutes * 60 + seconds;
};

export const percentFromTime = (
	currentSec: number,
	durationSec: number,
): number => {
	if (!(durationSec > 0) || !(currentSec >= 0)) {
		return 0;
	}

	return Math.min(
		99,
		Math.max(0, Math.floor((currentSec / durationSec) * 100)),
	);
};
