import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import Select from '../components/Select.js';
import {ru} from '../i18n/ru.js';
import type {WizardNavProps} from '../../core/wizard-nav.js';

export default function ThresholdStep({
	settings,
	patch,
	onNext,
}: WizardNavProps) {
	const [mode, setMode] = useState<'menu' | 'photo' | 'video'>('menu');
	const [draft, setDraft] = useState('');
	const showPhoto = settings.processPhotos;
	const showVideo = settings.processVideos;

	if (mode === 'photo' || mode === 'video') {
		return (
			<Box flexDirection="column">
				<Text>{mode === 'photo' ? ru.minPhotoMb : ru.minVideoMb}:</Text>
				<TextInput
					value={draft}
					onChange={setDraft}
					onSubmit={raw => {
						const n = Number(raw.replace(',', '.'));
						if (!Number.isFinite(n) || n < 0) {
							return;
						}

						if (mode === 'photo') {
							patch({minPhotoMb: n});
						} else {
							patch({minVideoMb: n});
						}

						setMode('menu');
					}}
				/>
			</Box>
		);
	}

	const summaryParts: string[] = [];
	if (showPhoto) {
		summaryParts.push(`Фото ≥ ${settings.minPhotoMb} МБ`);
	}

	if (showVideo) {
		summaryParts.push(`Видео ≥ ${settings.minVideoMb} МБ`);
	}

	return (
		<Box flexDirection="column">
			<Text>{summaryParts.join(' · ') || '—'}</Text>
			<Select
				items={[
					...(showPhoto
						? [{label: 'Изменить мин. фото', value: 'photo' as const}]
						: []),
					...(showVideo
						? [{label: 'Изменить мин. видео', value: 'video' as const}]
						: []),
					{label: '→ Далее', value: 'next'},
				]}
				initialValue="next"
				onSelect={v => {
					if (v === 'photo') {
						setDraft(String(settings.minPhotoMb));
						setMode('photo');
					} else if (v === 'video') {
						setDraft(String(settings.minVideoMb));
						setMode('video');
					} else {
						onNext();
					}
				}}
			/>
		</Box>
	);
}
