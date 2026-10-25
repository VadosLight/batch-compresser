import React from 'react';
import {Box, Text} from 'ink';
import {ru} from '../i18n/ru.js';
import type {CompressSettings} from '../types.js';

type Props = {
	settings: CompressSettings;
	scanCount: number;
	skipSmall: number;
	skipCompressed: number;
};

export default function ConfirmScreen({
	settings,
	scanCount,
	skipSmall,
	skipCompressed,
}: Props) {
	return (
		<Box flexDirection="column">
			<Text bold>{ru.confirmTitle}</Text>
			<Text>Папка: {settings.rootDir}</Text>
			<Text>{ru.foundFiles(scanCount)}</Text>
			<Text dimColor>
				{ru.skipSmall(skipSmall)} · {ru.skipCompressed(skipCompressed)}
			</Text>
			<Text>
				Режим: {settings.replaceFiles ? 'замена файлов' : 'рядом *_compressed'}
			</Text>
			<Text>
				Фото: {settings.processPhotos ? ru.on : ru.off}, мин{' '}
				{settings.minPhotoMb} МБ, {settings.megapixels || '∞'} Мп, q=
				{settings.photoQuality}
			</Text>
			<Text>
				Видео: {settings.processVideos ? ru.on : ru.off}, мин{' '}
				{settings.minVideoMb} МБ, CRF={settings.videoCrf}, высота=
				{settings.videoMaxHeight || 'исх.'}
			</Text>
			<Text>Воркеры фото: {settings.photoWorkers}</Text>
			<Box marginTop={1} flexDirection="column">
				<Text color="green">{ru.confirmStart}</Text>
				<Text dimColor>{ru.confirmCancel}</Text>
			</Box>
		</Box>
	);
}
