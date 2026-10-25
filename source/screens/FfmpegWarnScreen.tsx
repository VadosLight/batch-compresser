import React from 'react';
import {Box, Text} from 'ink';
import {ru} from '../i18n/ru.js';

export default function FfmpegWarnScreen() {
	return (
		<Box flexDirection="column">
			<Text color="yellow">{ru.ffmpegMissing}</Text>
			<Text dimColor>{ru.ffmpegOnlyPhotos} — Enter</Text>
		</Box>
	);
}
