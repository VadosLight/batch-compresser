import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import Select from '../components/Select.js';
import {ru} from '../i18n/ru.js';
import {getPreset, megapixelChoices, qualityPresets} from '../presets.js';
import type {
	MegapixelOption,
	PhotoFormatMode,
	QualityPresetId,
} from '../types.js';
import type {WizardNavProps} from '../ui/types.js';

export default function PhotoStep({settings, patch, onNext}: WizardNavProps) {
	const [sub, setSub] = useState<
		'menu' | 'format' | 'mp' | 'preset' | 'quality'
	>('menu');
	const [qualityDraft, setQualityDraft] = useState(
		String(settings.photoQuality),
	);

	if (sub === 'format') {
		return (
			<Box flexDirection="column">
				<Text>{ru.photoFormat}</Text>
				<Select
					items={[
						{label: ru.formatSame, value: 'same' as PhotoFormatMode},
						{label: ru.formatJpeg, value: 'jpeg'},
						{label: ru.formatWebp, value: 'webp'},
					]}
					initialValue={settings.photoFormat}
					onSelect={v => {
						patch({photoFormat: v});
						setSub('menu');
					}}
				/>
			</Box>
		);
	}

	if (sub === 'mp') {
		return (
			<Box flexDirection="column">
				<Text>{ru.megapixels}</Text>
				<Select
					items={megapixelChoices.map(c => ({
						label: c.label,
						value: c.value,
					}))}
					initialValue={settings.megapixels}
					onSelect={(v: MegapixelOption) => {
						patch({megapixels: v});
						setSub('menu');
					}}
				/>
			</Box>
		);
	}

	if (sub === 'preset') {
		return (
			<Box flexDirection="column">
				<Text>{ru.qualityPreset}</Text>
				<Select
					items={[
						...qualityPresets.map(p => ({
							label: `${p.label} (q=${p.photoQuality})`,
							value: p.id as QualityPresetId,
						})),
						{label: 'Свой', value: 'custom' as QualityPresetId},
					]}
					initialValue={settings.photoPreset}
					onSelect={id => {
						const preset = getPreset(id);
						if (preset) {
							patch({
								photoPreset: id,
								photoQuality: preset.photoQuality,
							});
						} else {
							patch({photoPreset: 'custom'});
						}

						setSub('menu');
					}}
				/>
			</Box>
		);
	}

	if (sub === 'quality') {
		return (
			<Box flexDirection="column">
				<Text>{ru.photoQuality}:</Text>
				<TextInput
					value={qualityDraft}
					onChange={setQualityDraft}
					onSubmit={raw => {
						const n = Number(raw);
						if (Number.isFinite(n) && n >= 1 && n <= 100) {
							patch({
								photoQuality: Math.round(n),
								photoPreset: 'custom',
							});
							setSub('menu');
						}
					}}
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text>
				Формат: {settings.photoFormat}, Мп: {settings.megapixels || 'без изм.'},
				качество: {settings.photoQuality}
			</Text>
			<Select
				items={[
					{label: 'Формат', value: 'format'},
					{label: 'Мегапиксели', value: 'mp'},
					{label: 'Пресет качества', value: 'preset'},
					{label: 'Число качества', value: 'quality'},
					{label: '→ Далее', value: 'next'},
				]}
				initialValue="next"
				onSelect={v => {
					if (v === 'next') {
						onNext();
					} else {
						setSub(v as typeof sub);
					}
				}}
			/>
		</Box>
	);
}
