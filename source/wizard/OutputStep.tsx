import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import Select from '../components/Select.js';
import {pickFile, pickFolder} from '../fs/pick-folder.js';
import {validateLogsPath} from '../fs/previous-logs.js';
import {ru} from '../i18n/ru.js';
import type {WizardNavProps} from '../ui/types.js';

type EditMode =
	| false
	| 'photo'
	| 'video'
	| 'stage-dir'
	| 'previous-logs'
	| 'previous-logs-type'
	| 'previous-logs-picking';

export default function OutputStep({settings, patch, onNext}: WizardNavProps) {
	const [editMode, setEditMode] = useState<EditMode>(false);
	const [draft, setDraft] = useState('');
	const [localError, setLocalError] = useState<string>();

	useInput((_input, key) => {
		if (
			(editMode === 'previous-logs' || editMode === 'previous-logs-type') &&
			key.escape
		) {
			setLocalError(undefined);
			setEditMode(false);
		}
	});

	const acceptPreviousLogs = async (raw: string) => {
		setLocalError(undefined);
		const trimmed = raw.trim();
		if (!trimmed) {
			patch({previousLogsPath: ''});
			setEditMode(false);
			return;
		}

		const result = await validateLogsPath(trimmed);
		if (!result.ok) {
			setLocalError(ru.previousLogsError[result.reason]);
			setEditMode('previous-logs');
			return;
		}

		patch({previousLogsPath: result.resolved});
		setEditMode(false);
	};

	const openPreviousLogsPicker = async (kind: 'file' | 'folder') => {
		setLocalError(undefined);
		setEditMode('previous-logs-picking');
		const picked =
			kind === 'folder'
				? await pickFolder({prompt: ru.previousLogsPickFolderPrompt})
				: await pickFile({prompt: ru.previousLogsPickFilePrompt});

		if (!picked.ok) {
			if (!picked.cancelled) {
				setLocalError(picked.message ?? ru.folderPickerFailed);
			}

			setEditMode('previous-logs');
			return;
		}

		await acceptPreviousLogs(picked.path);
	};

	if (editMode === 'previous-logs-picking') {
		return (
			<Box flexDirection="column">
				<Text>
					<Spinner type="dots" /> {ru.folderPickerOpen}
				</Text>
			</Box>
		);
	}

	if (editMode === 'previous-logs-type') {
		return (
			<Box flexDirection="column">
				<Text>{ru.previousLogsPath}:</Text>
				<Text dimColor>{ru.previousLogsHint}</Text>
				<TextInput
					value={draft}
					onChange={value => {
						setDraft(value);
						setLocalError(undefined);
					}}
					onSubmit={raw => {
						void acceptPreviousLogs(raw);
					}}
				/>
				{localError ? <Text color="red">{localError}</Text> : null}
				<Text dimColor>Enter — сохранить · Esc — назад</Text>
			</Box>
		);
	}

	if (editMode === 'previous-logs') {
		return (
			<Box flexDirection="column">
				<Text>
					{ru.previousLogsPath}:{' '}
					<Text color={settings.previousLogsPath.trim() ? 'green' : 'yellow'}>
						{settings.previousLogsPath.trim() || ru.pathNotSet}
					</Text>
				</Text>
				<Text dimColor>{ru.previousLogsHint}</Text>
				{localError ? <Text color="red">{localError}</Text> : null}
				<Select
					items={[
						{label: ru.pathTypeManually, value: 'type'},
						{label: ru.previousLogsOpenFolder, value: 'browse-folder'},
						{label: ru.previousLogsOpenFile, value: 'browse-file'},
						...(settings.previousLogsPath.trim()
							? [{label: ru.previousLogsClear, value: 'clear' as const}]
							: []),
						{label: '← Назад', value: 'back'},
					]}
					initialValue="browse-folder"
					onSelect={v => {
						if (v === 'type') {
							setDraft(settings.previousLogsPath);
							setEditMode('previous-logs-type');
							return;
						}

						if (v === 'browse-folder') {
							void openPreviousLogsPicker('folder');
							return;
						}

						if (v === 'browse-file') {
							void openPreviousLogsPicker('file');
							return;
						}

						if (v === 'clear') {
							patch({previousLogsPath: ''});
							setEditMode(false);
							return;
						}

						setLocalError(undefined);
						setEditMode(false);
					}}
				/>
			</Box>
		);
	}

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

	const previousLogsLabel = settings.previousLogsPath.trim() || ru.pathNotSet;

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
			<Text>
				{ru.previousLogsPath}: {previousLogsLabel}
			</Text>
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
					{label: 'Путь к предыдущим логам', value: 'previous-logs'},
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

					if (v === 'previous-logs') {
						setLocalError(undefined);
						setEditMode('previous-logs');
					}

					if (v === 'next') {
						onNext();
					}
				}}
			/>
		</Box>
	);
}
