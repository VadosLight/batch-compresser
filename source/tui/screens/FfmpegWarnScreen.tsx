import React from 'react';
import {Box, Text} from 'ink';
import type {FfmpegInstallPlan} from '../../core/ffmpeg-install.js';
import {formatInstallCommand} from '../../core/ffmpeg-install.js';
import {t} from '../i18n/index.js';

type Props = {
	plan?: FfmpegInstallPlan;
};

export default function FfmpegWarnScreen({plan}: Props) {
	return (
		<Box flexDirection="column">
			<Text color="yellow">{t.ffmpegMissing}</Text>
			{plan ? (
				<>
					<Text>{t.ffmpegInstallPrompt(plan.label)}</Text>
					<Text dimColor>{formatInstallCommand(plan)}</Text>
					<Text dimColor>{t.ffmpegInstallEnter}</Text>
					<Text dimColor>{t.ffmpegInstallEsc}</Text>
				</>
			) : (
				<>
					<Text dimColor>{t.ffmpegInstallManual}</Text>
					<Text dimColor>{t.ffmpegOnlyPhotos} — Enter / Esc</Text>
				</>
			)}
		</Box>
	);
}
