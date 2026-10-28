import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {t} from '../i18n/index.js';

type Props = {
	failed?: boolean;
	errorMessage?: string;
};

export default function FfmpegInstallingScreen({failed, errorMessage}: Props) {
	if (failed) {
		return (
			<Box flexDirection="column">
				<Text color="red">{t.ffmpegInstallFailed}</Text>
				{errorMessage ? <Text dimColor>{errorMessage}</Text> : null}
				<Text dimColor>{t.ffmpegInstallRetry}</Text>
				<Text dimColor>{t.ffmpegInstallEsc}</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text>
				<Spinner type="dots" /> {t.ffmpegInstalling}
			</Text>
		</Box>
	);
}
