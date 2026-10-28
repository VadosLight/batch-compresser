import React from 'react';
import {Box, Text} from 'ink';
import Select from '../components/Select.js';
import {ru} from '../i18n/ru.js';
import type {WizardNavProps} from '../../core/wizard-nav.js';

type Props = WizardNavProps & {
	ffmpegAvailable: boolean;
};

export default function MediaTypesStep({
	settings,
	patch,
	onNext,
	ffmpegAvailable,
}: Props) {
	return (
		<Box flexDirection="column">
			<Text>
				Фото: {settings.processPhotos ? ru.yes : ru.no} · Видео:{' '}
				{settings.processVideos ? ru.yes : ru.no}
			</Text>
			<Select
				items={[
					{
						label: settings.processPhotos ? 'Выключить фото' : 'Включить фото',
						value: 'toggle-photo',
					},
					{
						label: settings.processVideos
							? 'Выключить видео'
							: `Включить видео${ffmpegAvailable ? '' : ' (нет ffmpeg)'}`,
						value: 'toggle-video',
					},
					{label: '→ Далее', value: 'next'},
				]}
				initialValue="next"
				onSelect={v => {
					if (v === 'toggle-photo') {
						patch({processPhotos: !settings.processPhotos});
					}

					if (v === 'toggle-video' && ffmpegAvailable) {
						patch({processVideos: !settings.processVideos});
					}

					if (v === 'next') {
						onNext();
					}
				}}
			/>
		</Box>
	);
}
