import {formatBytes, ru} from '../i18n/ru.js';
import type {RunSummary} from '../types.js';

export type DurationTier = 'quick' | 'standard' | 'long' | 'marathon' | 'epic';

export type Celebration = {
	tier: DurationTier;
	title: string;
	subtitle: string;
	banner?: string;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const formatDuration = (elapsedMs: number): string => {
	const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
	const days = Math.floor(totalSec / 86_400);
	const hours = Math.floor((totalSec % 86_400) / 3600);
	const minutes = Math.floor((totalSec % 3600) / 60);
	const seconds = totalSec % 60;
	const parts: string[] = [];

	if (days > 0) {
		parts.push(`${days} д`);
	}

	if (hours > 0) {
		parts.push(`${hours} ч`);
	}

	if (minutes > 0 && days === 0) {
		parts.push(`${minutes} мин`);
	}

	if (parts.length === 0) {
		parts.push(`${seconds} с`);
	} else if (days === 0 && hours === 0 && seconds > 0 && minutes < 5) {
		parts.push(`${seconds} с`);
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

const banners: Partial<Record<DurationTier, string>> = {
	marathon: ['  ~~~~~~~~~~~~~~', '  ~  MARATHON  ~', '  ~~~~~~~~~~~~~~'].join(
		'\n',
	),
	epic: [
		'  ==================',
		'  ||  EPIC RUN  ||',
		'  ==================',
	].join('\n'),
};

export const buildCelebration = (summary: RunSummary): Celebration => {
	const tier = durationTier(summary.elapsedMs);
	const elapsedLabel = formatDuration(summary.elapsedMs);
	const saved = Math.max(0, summary.bytesBefore - summary.bytesAfter);
	const savedLabel = formatBytes(saved);

	return {
		tier,
		title: ru.celebrationTitle[tier],
		subtitle: ru.celebrationSubtitle(
			tier,
			summary.compressed,
			elapsedLabel,
			savedLabel,
		),
		banner: banners[tier],
	};
};
