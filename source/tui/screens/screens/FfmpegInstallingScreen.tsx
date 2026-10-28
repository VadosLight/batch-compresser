import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {ru} from '../i18n/ru.js';

type Props = {
	failed?: boolean;
	errorMessage?: string;
};

export default function FfmpegInstallingScreen({failed, errorMessage}: Props) {
	if (failed) {
		return (
			<Box flexDirection="column">
				<Text color="red">{ru.ffmpegInstallFailed}</Text>
				{errorMessage ? <Text dimColor>{errorMessage}</Text> : null}
				<Text dimColor>{ru.ffmpegInstallRetry}</Text>
				<Text dimColor>{ru.ffmpegInstallEsc}</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text>
				<Spinner type="dots" /> {ru.ffmpegInstalling}
			</Text>
		</Box>
	);
}
