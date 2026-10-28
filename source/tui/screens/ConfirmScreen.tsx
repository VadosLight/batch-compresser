import React from 'react';
import {Box, Text} from 'ink';
import {t} from '../i18n/index.js';
import type {CompressSettings} from '../../core/types.js';

type Props = {
	settings: CompressSettings;
	scanCount: number;
	skipSmall: number;
	skipCompressed: number;
	skipPrevious: number;
};

export default function ConfirmScreen({
	settings,
	scanCount,
	skipSmall,
	skipCompressed,
	skipPrevious,
}: Props) {
	const workerParts: string[] = [];
	if (settings.processPhotos) {
		workerParts.push(t.workerPhoto(settings.photoWorkers));
	}

	if (settings.processVideos) {
		workerParts.push(t.workerVideo(settings.videoWorkers));
	}

	return (
		<Box flexDirection="column">
			<Text bold>{t.confirmTitle}</Text>
			<Text>{t.confirmFolder(settings.rootDir)}</Text>
			<Text>{t.foundFiles(scanCount)}</Text>
			<Text dimColor>
				{t.skipSmall(skipSmall)} · {t.skipCompressed(skipCompressed)}
				{skipPrevious > 0 ? ` · ${t.skipPrevious(skipPrevious)}` : ''}
			</Text>
			<Text>{t.confirmMode(settings.replaceFiles)}</Text>
			{settings.processPhotos ? (
				<Text>
					{t.confirmPhoto({
						minMb: settings.minPhotoMb,
						mpLabel: settings.megapixels
							? String(settings.megapixels)
							: t.mpUnlimited,
						quality: settings.photoQuality,
					})}
				</Text>
			) : null}
			{settings.processVideos ? (
				<Text>
					{t.confirmVideo({
						minMb: settings.minVideoMb,
						crf: settings.videoCrf,
						heightLabel: settings.videoMaxHeight
							? String(settings.videoMaxHeight)
							: t.heightSourceShort,
						smallFirstSuffix: settings.videosSmallFirst
							? `, ${t.videosSmallFirst.toLowerCase()}`
							: '',
						scanFormats: settings.videoScanAllFormats
							? t.videoScanAllFormatsOn
							: t.videoScanAllFormatsOff,
					})}
				</Text>
			) : null}
			{workerParts.length > 0 ? (
				<Text>{t.confirmWorkers(workerParts.join(', '))}</Text>
			) : null}
			<Text>
				{t.confirmStaging(settings.stageToFastDisk, settings.stageDir)}
			</Text>
			{settings.previousLogsPath.trim() ? (
				<Text>
					{t.previousLogsPath}: {settings.previousLogsPath.trim()}
				</Text>
			) : null}
			<Box marginTop={1} flexDirection="column">
				<Text color="green">{t.confirmStart}</Text>
				<Text dimColor>{t.confirmCancel}</Text>
			</Box>
		</Box>
	);
}
