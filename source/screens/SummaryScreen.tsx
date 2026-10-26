import React from 'react';
import {Box, Text} from 'ink';
import {ru} from '../i18n/ru.js';
import type {RunSummary} from '../types.js';

type Props = {
	summary: RunSummary;
};

export default function SummaryScreen({summary}: Props) {
	const saved = summary.bytesBefore - summary.bytesAfter;
	const pct = summary.bytesBefore > 0 ? (saved / summary.bytesBefore) * 100 : 0;

	return (
		<Box flexDirection="column">
			<Text bold>{ru.summaryTitle}</Text>
			<Text>{ru.foundFiles(summary.found)}</Text>
			<Text>{ru.compressed(summary.compressed)}</Text>
			<Text>{ru.skipSmall(summary.skipSmall)}</Text>
			<Text>{ru.skipCompressed(summary.skipCompressed)}</Text>
			<Text>{ru.skipPrevious(summary.skipPrevious)}</Text>
			<Text>{ru.skipLarger(summary.skipLarger)}</Text>
			<Text>{ru.skipLowGain(summary.skipLowGain)}</Text>
			<Text color={summary.errors ? 'red' : undefined}>
				{ru.errors(summary.errors)}
			</Text>
			<Text>{ru.bytes(summary.bytesBefore, summary.bytesAfter, pct)}</Text>
			<Text>{ru.logPath(summary.logPath)}</Text>
			<Box marginTop={1}>
				<Text dimColor>{ru.done}</Text>
			</Box>
		</Box>
	);
}
