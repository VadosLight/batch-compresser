import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import Select, {type SelectItem} from '../components/Select.js';
import {pickFolder} from '../adapters/pick-folder.js';
import {validateDirectory} from '../../core/fs/validate-dir.js';
import {ru} from '../i18n/ru.js';
import type {PatchSettings} from '../../core/wizard-nav.js';

type PathAction = 'type' | 'browse' | 'next';

type Props = {
	pathDraft: string;
	setPathDraft: (value: string) => void;
	patch: PatchSettings;
	onNext: () => void;
};

type Mode = 'menu' | 'typing' | 'picking';

export default function PathStep({
	pathDraft,
	setPathDraft,
	patch,
	onNext,
}: Props) {
	const [mode, setMode] = useState<Mode>('menu');
	const [localError, setLocalError] = useState<string>();
	const [draft, setDraft] = useState(pathDraft);

	useInput((_input, key) => {
		if (mode === 'typing' && key.escape) {
			setMode('menu');
		}
	});

	const acceptPath = async (raw: string) => {
		setLocalError(undefined);
		const result = await validateDirectory(raw);
		if (!result.ok) {
			setLocalError(ru.pathError[result.reason]);
			setMode('menu');
			return;
		}

		setPathDraft(result.resolved);
		setDraft(result.resolved);
		patch({rootDir: result.resolved});
		onNext();
	};

	const openPicker = async () => {
		setLocalError(undefined);
		setMode('picking');
		const picked = await pickFolder();
		if (!picked.ok) {
			if (!picked.cancelled) {
				setLocalError(picked.message ?? ru.folderPickerFailed);
			}

			setMode('menu');
			return;
		}

		await acceptPath(picked.path);
	};

	if (mode === 'picking') {
		return (
			<Box flexDirection="column">
				<Text>
					<Spinner type="dots" /> {ru.folderPickerOpen}
				</Text>
			</Box>
		);
	}

	if (mode === 'typing') {
		return (
			<Box flexDirection="column">
				<Text>{ru.pathPrompt}:</Text>
				<TextInput
					value={draft}
					onChange={value => {
						setDraft(value);
						setLocalError(undefined);
					}}
					onSubmit={value => {
						void acceptPath(value);
					}}
				/>
				{localError ? <Text color="red">{localError}</Text> : null}
				<Text dimColor>Enter — проверить и далее · Esc — меню</Text>
			</Box>
		);
	}

	const typeLabel: string = ru.pathTypeManually;
	const browseLabel: string = ru.pathOpenExplorer;
	const menuItems: Array<SelectItem<PathAction>> = [
		{label: typeLabel, value: 'type'},
		{label: browseLabel, value: 'browse'},
		{label: '→ Далее', value: 'next'},
	];

	return (
		<Box flexDirection="column">
			<Text>
				{ru.pathPrompt}:{' '}
				<Text color={pathDraft ? 'green' : 'yellow'}>
					{pathDraft || ru.pathNotSet}
				</Text>
			</Text>
			{localError ? <Text color="red">{localError}</Text> : null}
			<Select
				items={menuItems}
				initialValue={pathDraft ? 'next' : 'browse'}
				onSelect={value => {
					if (value === 'type') {
						setDraft(pathDraft);
						setMode('typing');
						return;
					}

					if (value === 'browse') {
						void openPicker();
						return;
					}

					void acceptPath(pathDraft || draft);
				}}
			/>
		</Box>
	);
}
