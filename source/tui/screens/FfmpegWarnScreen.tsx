import React from 'react';
import {Box, Text} from 'ink';
import type {FfmpegInstallPlan} from '../../core/ffmpeg-install.js';
import {formatInstallCommand} from '../../core/ffmpeg-install.js';
import {ru} from '../i18n/ru.js';

type Props = {
	plan?: FfmpegInstallPlan;
};

export default function FfmpegWarnScreen({plan}: Props) {
	return (
		<Box flexDirection="column">
			<Text color="yellow">{ru.ffmpegMissing}</Text>
			{plan ? (
				<>
					<Text>{ru.ffmpegInstallPrompt(plan.label)}</Text>
					<Text dimColor>{formatInstallCommand(plan)}</Text>
					<Text dimColor>{ru.ffmpegInstallEnter}</Text>
					<Text dimColor>{ru.ffmpegInstallEsc}</Text>
				</>
			) : (
				<>
					<Text dimColor>{ru.ffmpegInstallManual}</Text>
					<Text dimColor>{ru.ffmpegOnlyPhotos} — Enter / Esc</Text>
				</>
			)}
		</Box>
	);
}
