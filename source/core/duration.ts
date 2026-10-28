export type DurationTier = 'quick' | 'standard' | 'long' | 'marathon' | 'epic';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Locale-neutral duration for logs and view-models. */
export const formatDuration = (elapsedMs: number): string => {
	const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
	const days = Math.floor(totalSec / 86_400);
	const hours = Math.floor((totalSec % 86_400) / 3600);
	const minutes = Math.floor((totalSec % 3600) / 60);
	const seconds = totalSec % 60;
	const parts: string[] = [];

	if (days > 0) {
		parts.push(`${days}d`);
	}

	if (hours > 0) {
		parts.push(`${hours}h`);
	}

	if (minutes > 0 && days === 0) {
		parts.push(`${minutes}m`);
	}

	if (parts.length === 0) {
		parts.push(`${seconds}s`);
	} else if (days === 0 && hours === 0 && seconds > 0 && minutes < 5) {
		parts.push(`${seconds}s`);
	}

	return parts.join(' ');
};

export const durationTier = (elapsedMs: number): DurationTier => {
	if (elapsedMs < 5 * MINUTE) {
		return 'quick';
	}

	if (elapsedMs < HOUR) {
		return 'standard';
	}

	if (elapsedMs < 8 * HOUR) {
		return 'long';
	}

	if (elapsedMs < DAY) {
		return 'marathon';
	}

	return 'epic';
};
