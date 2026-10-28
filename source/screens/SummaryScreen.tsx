import React from 'react';
import {Box, Text} from 'ink';
import {formatBytes, ru} from '../i18n/ru.js';
import type {RunSummary} from '../types.js';
import {
	buildCelebration,
	formatDuration,
	type DurationTier,
} from '../ui/summary-celebration.js';

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
	const elapsedLabel = formatDuration(summary.elapsedMs);

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
					{ru.summaryStats({
						elapsedLabel,
						compressed: summary.compressed,
						before: formatBytes(summary.bytesBefore),
						after: formatBytes(summary.bytesAfter),
						pct,
					})}
				</Text>
			</Box>
			<Box marginTop={1} flexDirection="column">
				<Text dimColor>{ru.foundFiles(summary.found)}</Text>
				<Text dimColor>{ru.skipSmall(summary.skipSmall)}</Text>
				<Text dimColor>{ru.skipCompressed(summary.skipCompressed)}</Text>
				<Text dimColor>{ru.skipPrevious(summary.skipPrevious)}</Text>
				<Text dimColor>{ru.skipUser(summary.skipUser)}</Text>
				<Text dimColor>{ru.skipLarger(summary.skipLarger)}</Text>
				<Text dimColor>{ru.skipLowGain(summary.skipLowGain)}</Text>
				<Text
					color={summary.errors ? 'red' : undefined}
					dimColor={!summary.errors}
				>
					{ru.errors(summary.errors)}
				</Text>
			</Box>
			<Text>{ru.logPath(summary.logPath)}</Text>
			<Box marginTop={1}>
				<Text dimColor>{ru.done}</Text>
			</Box>
		</Box>
	);
}
