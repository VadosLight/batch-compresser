import type {DurationTier} from '../../core/duration.js';
import type {RunSummary} from '../../core/types.js';
import {formatBytes, t} from '../i18n/index.js';

export type Celebration = {
	tier: DurationTier;
	title: string;
	subtitle: string;
	banner?: string;
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

/** Locale-aware duration for TUI. */
export const formatDurationUi = (elapsedMs: number): string => {
	const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
	const days = Math.floor(totalSec / 86_400);
	const hours = Math.floor((totalSec % 86_400) / 3600);
	const minutes = Math.floor((totalSec % 3600) / 60);
	const seconds = totalSec % 60;
	const {d, h, min, s} = t.durationUnits;
	const parts: string[] = [];

	if (days > 0) {
		parts.push(`${days} ${d}`);
	}

	if (hours > 0) {
		parts.push(`${hours} ${h}`);
	}

	if (minutes > 0 && days === 0) {
		parts.push(`${minutes} ${min}`);
	}

	if (parts.length === 0) {
		parts.push(`${seconds} ${s}`);
	} else if (days === 0 && hours === 0 && seconds > 0 && minutes < 5) {
		parts.push(`${seconds} ${s}`);
	}

	return parts.join(' ');
};

/** @deprecated Use formatDurationUi */
export const formatDurationRu = formatDurationUi;

export const buildCelebration = (summary: RunSummary): Celebration => {
	const tier = summary.durationTier;
	const elapsedLabel = formatDurationUi(summary.elapsedMs);
	const saved = Math.max(0, summary.bytesBefore - summary.bytesAfter);
	const savedLabel = formatBytes(saved);

	return {
		tier,
		title: t.celebrationTitle[tier],
		subtitle: t.celebrationSubtitle(
			tier,
			summary.compressed,
			elapsedLabel,
			savedLabel,
		),
		banner: banners[tier],
	};
};
