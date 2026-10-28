import React from 'react';
import {Box, Text} from 'ink';
import {ru} from '../i18n/ru.js';
import type {CompressSettings} from '../types.js';

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
		workerParts.push(`фото ${settings.photoWorkers}`);
	}

	if (settings.processVideos) {
		workerParts.push(`видео ${settings.videoWorkers}`);
	}

	return (
		<Box flexDirection="column">
			<Text bold>{ru.confirmTitle}</Text>
			<Text>Папка: {settings.rootDir}</Text>
			<Text>{ru.foundFiles(scanCount)}</Text>
			<Text dimColor>
				{ru.skipSmall(skipSmall)} · {ru.skipCompressed(skipCompressed)}
				{skipPrevious > 0 ? ` · ${ru.skipPrevious(skipPrevious)}` : ''}
			</Text>
			<Text>
				Режим: {settings.replaceFiles ? 'замена файлов' : 'рядом *_compressed'}
			</Text>
			{settings.processPhotos ? (
				<Text>
					Фото: мин {settings.minPhotoMb} МБ, {settings.megapixels || '∞'} Мп,
					q=
					{settings.photoQuality}
				</Text>
			) : null}
			{settings.processVideos ? (
				<Text>
					Видео: мин {settings.minVideoMb} МБ, CRF={settings.videoCrf}, высота=
					{settings.videoMaxHeight || 'исх.'}
					{settings.videosSmallFirst
						? `, ${ru.videosSmallFirst.toLowerCase()}`
						: ''}
					,{' '}
					{settings.videoScanAllFormats
						? ru.videoScanAllFormatsOn
						: ru.videoScanAllFormatsOff}
				</Text>
			) : null}
			{workerParts.length > 0 ? (
				<Text>Воркеры: {workerParts.join(', ')}</Text>
			) : null}
			<Text>
				Staging: {settings.stageToFastDisk ? ru.yes : ru.no}
				{settings.stageToFastDisk ? ` → ${settings.stageDir}` : ''}
			</Text>
			{settings.previousLogsPath.trim() ? (
				<Text>
					{ru.previousLogsPath}: {settings.previousLogsPath.trim()}
				</Text>
			) : null}
			<Box marginTop={1} flexDirection="column">
				<Text color="green">{ru.confirmStart}</Text>
				<Text dimColor>{ru.confirmCancel}</Text>
			</Box>
		</Box>
	);
}
