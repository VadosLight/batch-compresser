import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import Select from '../components/Select.js';
import {ru} from '../i18n/ru.js';
import type {WizardNavProps} from '../ui/types.js';

export default function ThresholdStep({
	settings,
	patch,
	onNext,
}: WizardNavProps) {
	const [mode, setMode] = useState<'menu' | 'photo' | 'video'>('menu');
	const [draft, setDraft] = useState('');

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

	return (
		<Box flexDirection="column">
			<Text>
				Фото ≥ {settings.minPhotoMb} МБ · Видео ≥ {settings.minVideoMb} МБ
			</Text>
			<Select
				items={[
					{label: 'Изменить мин. фото', value: 'photo'},
					{label: 'Изменить мин. видео', value: 'video'},
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
