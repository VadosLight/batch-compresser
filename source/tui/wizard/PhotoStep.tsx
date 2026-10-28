import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import Select from '../components/Select.js';
import {t} from '../i18n/index.js';
import {
	getPreset,
	megapixelChoices,
	qualityPresets,
} from '../../core/presets.js';
import type {
	MegapixelOption,
	PhotoFormatMode,
	QualityPresetId,
} from '../../core/types.js';
import type {WizardNavProps} from '../../core/wizard-nav.js';

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
				<Text>{t.photoFormat}</Text>
				<Select
					items={[
						{label: t.formatSame, value: 'same' as PhotoFormatMode},
						{label: t.formatJpeg, value: 'jpeg'},
						{label: t.formatWebp, value: 'webp'},
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
				<Text>{t.megapixels}</Text>
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
				<Text>{t.qualityPreset}</Text>
				<Select
					items={[
						...qualityPresets.map(p => ({
							label: `${
								p.id === 'high'
									? t.qualityHigh
									: p.id === 'medium'
										? t.qualityMedium
										: t.qualityLow
							} (q=${p.photoQuality})`,
							value: p.id as QualityPresetId,
						})),
						{label: t.customPreset, value: 'custom' as QualityPresetId},
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
				<Text>{t.photoQuality}:</Text>
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
				{t.photoSummary(
					settings.photoFormat,
					settings.megapixels ? String(settings.megapixels) : t.mpUnchanged,
					settings.photoQuality,
				)}
			</Text>
			<Select
				items={[
					{label: t.menuFormat, value: 'format'},
					{label: t.menuMp, value: 'mp'},
					{label: t.menuQualityPreset, value: 'preset'},
					{label: t.menuQualityNumber, value: 'quality'},
					{label: t.nextArrow, value: 'next'},
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
