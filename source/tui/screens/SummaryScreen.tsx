import React from 'react';
import {Box, Text} from 'ink';
import type {DurationTier} from '../../core/duration.js';
import type {RunSummary} from '../../core/types.js';
import {formatBytes, t} from '../i18n/index.js';
import {buildCelebration, formatDurationUi} from '../ui/celebration.js';

type Props = {
	summary: RunSummary;
};

const titleColor = (tier: DurationTier): string | undefined => {
	if (tier === 'epic' || tier === 'marathon') {
		return 'yellow';
	}

	if (tier === 'long') {
		return 'cyan';
	}

	return 'green';
};

export default function SummaryScreen({summary}: Props) {
	const saved = summary.bytesBefore - summary.bytesAfter;
	const pct = summary.bytesBefore > 0 ? (saved / summary.bytesBefore) * 100 : 0;
	const celebration = buildCelebration(summary);
	const elapsedLabel = formatDurationUi(summary.elapsedMs);

	return (
		<Box flexDirection="column">
			{celebration.banner ? (
				<Text color={titleColor(celebration.tier)}>{celebration.banner}</Text>
			) : null}
			<Text bold color={titleColor(celebration.tier)}>
				{celebration.title}
			</Text>
			<Text>{celebration.subtitle}</Text>
			<Box marginTop={1}>
				<Text>
					{t.summaryStats({
						elapsedLabel,
						compressed: summary.compressed,
						before: formatBytes(summary.bytesBefore),
						after: formatBytes(summary.bytesAfter),
						pct,
					})}
				</Text>
			</Box>
			<Box marginTop={1} flexDirection="column">
				<Text dimColor>{t.foundFiles(summary.found)}</Text>
				<Text dimColor>{t.skipSmall(summary.skipSmall)}</Text>
				<Text dimColor>{t.skipCompressed(summary.skipCompressed)}</Text>
				<Text dimColor>{t.skipPrevious(summary.skipPrevious)}</Text>
				<Text dimColor>{t.skipUser(summary.skipUser)}</Text>
				<Text dimColor>{t.skipLarger(summary.skipLarger)}</Text>
				<Text dimColor>{t.skipLowGain(summary.skipLowGain)}</Text>
				<Text
					color={summary.errors ? 'red' : undefined}
					dimColor={!summary.errors}
				>
					{t.errors(summary.errors)}
				</Text>
			</Box>
			<Text>{t.logPath(summary.logPath)}</Text>
			<Box marginTop={1}>
				<Text dimColor>{t.done}</Text>
			</Box>
		</Box>
	);
}
