import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import Select from '../components/Select.js';
import {pickFile, pickFolder} from '../adapters/pick-folder.js';
import {validateLogsPath} from '../../core/fs/previous-logs.js';
import {t} from '../i18n/index.js';
import type {WizardNavProps} from '../../core/wizard-nav.js';

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
			setLocalError(t.previousLogsError[result.reason]);
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
				? await pickFolder({prompt: t.previousLogsPickFolderPrompt})
				: await pickFile({prompt: t.previousLogsPickFilePrompt});

		if (!picked.ok) {
			if (!picked.cancelled) {
				setLocalError(picked.message ?? t.folderPickerFailed);
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
					<Spinner type="dots" /> {t.folderPickerOpen}
				</Text>
			</Box>
		);
	}

	if (editMode === 'previous-logs-type') {
		return (
			<Box flexDirection="column">
				<Text>{t.previousLogsPath}:</Text>
				<Text dimColor>{t.previousLogsHint}</Text>
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
				<Text dimColor>{t.enterSaveBack}</Text>
			</Box>
		);
	}

	if (editMode === 'previous-logs') {
		return (
			<Box flexDirection="column">
				<Text>
					{t.previousLogsPath}:{' '}
					<Text color={settings.previousLogsPath.trim() ? 'green' : 'yellow'}>
						{settings.previousLogsPath.trim() || t.pathNotSet}
					</Text>
				</Text>
				<Text dimColor>{t.previousLogsHint}</Text>
				{localError ? <Text color="red">{localError}</Text> : null}
				<Select
					items={[
						{label: t.pathTypeManually, value: 'type'},
						{label: t.previousLogsOpenFolder, value: 'browse-folder'},
						{label: t.previousLogsOpenFile, value: 'browse-file'},
						...(settings.previousLogsPath.trim()
							? [{label: t.previousLogsClear, value: 'clear' as const}]
							: []),
						{label: t.backArrow, value: 'back'},
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
				<Text>{t.stageDir}:</Text>
				<Text dimColor>{t.stageDirHint}</Text>
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
			editMode === 'photo' ? t.photoWorkers : t.videoWorkers;
		const hint: string = t.workersHint;
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

	const previousLogsLabel = settings.previousLogsPath.trim() || t.pathNotSet;
	const showPhotoWorkers = settings.processPhotos;
	const showVideoWorkers = settings.processVideos;

	return (
		<Box flexDirection="column">
			<Text>
				{t.replaceFiles}: {settings.replaceFiles ? t.yes : t.no}
			</Text>
			{showPhotoWorkers ? (
				<Text>
					{t.photoWorkers}: {settings.photoWorkers}
				</Text>
			) : null}
			{showVideoWorkers ? (
				<Text>
					{t.videoWorkers}: {settings.videoWorkers}
				</Text>
			) : null}
			<Text>
				{t.stageToFastDisk}: {settings.stageToFastDisk ? t.yes : t.no}
			</Text>
			{settings.stageToFastDisk ? (
				<Text dimColor>
					{t.stageDir}: {settings.stageDir}
				</Text>
			) : null}
			<Text>
				{t.previousLogsPath}: {previousLogsLabel}
			</Text>
			{showVideoWorkers ? <Text dimColor>{t.stageHint}</Text> : null}
			<Select
				items={[
					{
						label: settings.replaceFiles
							? t.outputToggleToSibling
							: t.outputToggleToReplace,
						value: 'toggle-replace',
					},
					...(showPhotoWorkers
						? [{label: t.outputPhotoWorkers, value: 'photo-workers' as const}]
						: []),
					...(showVideoWorkers
						? [{label: t.outputVideoWorkers, value: 'video-workers' as const}]
						: []),
					{
						label: settings.stageToFastDisk
							? t.outputStagingOff
							: t.outputStagingOn,
						value: 'toggle-stage',
					},
					...(settings.stageToFastDisk
						? [{label: t.outputStageDir, value: 'stage-dir' as const}]
						: []),
					{label: t.outputPreviousLogs, value: 'previous-logs'},
					{label: t.nextArrow, value: 'next'},
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
