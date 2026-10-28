import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import Select, {type SelectItem} from '../components/Select.js';
import {pickFolder} from '../adapters/pick-folder.js';
import {validateDirectory} from '../../core/fs/validate-dir.js';
import {t} from '../i18n/index.js';
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
			setLocalError(t.pathError[result.reason]);
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
				setLocalError(picked.message ?? t.folderPickerFailed);
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
					<Spinner type="dots" /> {t.folderPickerOpen}
				</Text>
			</Box>
		);
	}

	if (mode === 'typing') {
		return (
			<Box flexDirection="column">
				<Text>{t.pathPrompt}:</Text>
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
				<Text dimColor>{t.enterValidateNext}</Text>
			</Box>
		);
	}

	const typeLabel: string = t.pathTypeManually;
	const browseLabel: string = t.pathOpenExplorer;
	const menuItems: Array<SelectItem<PathAction>> = [
		{label: typeLabel, value: 'type'},
		{label: browseLabel, value: 'browse'},
		{label: t.nextArrow, value: 'next'},
	];

	return (
		<Box flexDirection="column">
			<Text>
				{t.pathPrompt}:{' '}
				<Text color={pathDraft ? 'green' : 'yellow'}>
					{pathDraft || t.pathNotSet}
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
