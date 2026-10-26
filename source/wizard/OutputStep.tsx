import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import Select from '../components/Select.js';
import {ru} from '../i18n/ru.js';
import type {WizardNavProps} from '../ui/types.js';

type EditMode = false | 'photo' | 'video' | 'stage-dir';

export default function OutputStep({settings, patch, onNext}: WizardNavProps) {
	const [editMode, setEditMode] = useState<EditMode>(false);
	const [draft, setDraft] = useState('');

	if (editMode === 'stage-dir') {
		return (
			<Box flexDirection="column">
				<Text>{ru.stageDir}:</Text>
				<Text dimColor>{ru.stageDirHint}</Text>
				<TextInput
					value={draft}
					onChange={setDraft}
					onSubmit={raw => {
						const trimmed = raw.trim();
						if (trimmed) {
							patch({stageDir: trimmed});
						}

						setEditMode(false);
					}}
				/>
			</Box>
		);
	}

	if (editMode === 'photo' || editMode === 'video') {
		const label: string =
			editMode === 'photo' ? ru.photoWorkers : ru.videoWorkers;
		const hint: string = ru.workersHint;
		return (
			<Box flexDirection="column">
				<Text>{label}:</Text>
				<Text dimColor>{hint}</Text>
				<TextInput
					value={draft}
					onChange={setDraft}
					onSubmit={raw => {
						const n = Number(raw);
						if (Number.isFinite(n) && n >= 1) {
							const value = Math.round(n);
							if (editMode === 'photo') {
								patch({photoWorkers: value});
							} else {
								patch({videoWorkers: value});
							}
						}

						setEditMode(false);
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
			<Text>
				{ru.videoWorkers}: {settings.videoWorkers}
			</Text>
			<Text>
				{ru.stageToFastDisk}: {settings.stageToFastDisk ? ru.yes : ru.no}
			</Text>
			{settings.stageToFastDisk ? (
				<Text dimColor>
					{ru.stageDir}: {settings.stageDir}
				</Text>
			) : null}
			<Text dimColor>{ru.stageHint}</Text>
			<Select
				items={[
					{
						label: settings.replaceFiles
							? 'Переключить на «рядом *_compressed»'
							: 'Переключить на полную замену',
						value: 'toggle-replace',
					},
					{label: 'Воркеры фото', value: 'photo-workers'},
					{label: 'Воркеры видео', value: 'video-workers'},
					{
						label: settings.stageToFastDisk
							? 'Выключить staging на быстрый диск'
							: 'Включить staging (HDD→SSD tmp)',
						value: 'toggle-stage',
					},
					...(settings.stageToFastDisk
						? [{label: 'Путь staging-папки', value: 'stage-dir' as const}]
						: []),
					{label: '→ Далее', value: 'next'},
				]}
				initialValue="next"
				onSelect={v => {
					if (v === 'toggle-replace') {
						patch({replaceFiles: !settings.replaceFiles});
					}

					if (v === 'photo-workers') {
						setDraft(String(settings.photoWorkers));
						setEditMode('photo');
					}

					if (v === 'video-workers') {
						setDraft(String(settings.videoWorkers));
						setEditMode('video');
					}

					if (v === 'toggle-stage') {
						patch({stageToFastDisk: !settings.stageToFastDisk});
					}

					if (v === 'stage-dir') {
						setDraft(settings.stageDir);
						setEditMode('stage-dir');
					}

					if (v === 'next') {
						onNext();
					}
				}}
			/>
		</Box>
	);
}
