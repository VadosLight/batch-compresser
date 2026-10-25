import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import Select from '../components/Select.js';
import {ru} from '../i18n/ru.js';
import type {WizardNavProps} from '../ui/types.js';

export default function OutputStep({settings, patch, onNext}: WizardNavProps) {
	const [editWorkers, setEditWorkers] = useState(false);
	const [draft, setDraft] = useState(String(settings.photoWorkers));

	if (editWorkers) {
		return (
			<Box flexDirection="column">
				<Text>{ru.photoWorkers}:</Text>
				<TextInput
					value={draft}
					onChange={setDraft}
					onSubmit={raw => {
						const n = Number(raw);
						if (Number.isFinite(n) && n >= 1) {
							patch({photoWorkers: Math.round(n)});
						}

						setEditWorkers(false);
					}}
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text>
				{ru.replaceFiles}: {settings.replaceFiles ? ru.yes : ru.no}
			</Text>
			<Text>
				{ru.photoWorkers}: {settings.photoWorkers}
			</Text>
			<Select
				items={[
					{
						label: settings.replaceFiles
							? 'Переключить на «рядом *_compressed»'
							: 'Переключить на полную замену',
						value: 'toggle-replace',
					},
					{label: 'Число воркеров фото', value: 'workers'},
					{label: '→ Далее', value: 'next'},
				]}
				initialValue="next"
				onSelect={v => {
					if (v === 'toggle-replace') {
						patch({replaceFiles: !settings.replaceFiles});
					}

					if (v === 'workers') {
						setDraft(String(settings.photoWorkers));
						setEditWorkers(true);
					}

					if (v === 'next') {
						onNext();
					}
				}}
			/>
		</Box>
	);
}
