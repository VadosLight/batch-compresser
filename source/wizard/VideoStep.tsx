import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import Select from '../components/Select.js';
import {ru} from '../i18n/ru.js';
import {getPreset, qualityPresets, videoHeightChoices} from '../presets.js';
import type {QualityPresetId, VideoMaxHeight} from '../types.js';
import type {WizardNavProps} from '../ui/types.js';

export default function VideoStep({settings, patch, onNext}: WizardNavProps) {
	const [sub, setSub] = useState<'menu' | 'preset' | 'crf' | 'height'>('menu');
	const [crfDraft, setCrfDraft] = useState(String(settings.videoCrf));

	if (sub === 'preset') {
		return (
			<Box flexDirection="column">
				<Text>{ru.qualityPreset}</Text>
				<Select
					items={[
						...qualityPresets.map(p => ({
							label: `${p.label} (CRF=${p.videoCrf})`,
							value: p.id as QualityPresetId,
						})),
						{label: 'Свой', value: 'custom' as QualityPresetId},
					]}
					initialValue={settings.videoPreset}
					onSelect={id => {
						const preset = getPreset(id);
						if (preset) {
							patch({videoPreset: id, videoCrf: preset.videoCrf});
						} else {
							patch({videoPreset: 'custom'});
						}

						setSub('menu');
					}}
				/>
			</Box>
		);
	}

	if (sub === 'crf') {
		return (
			<Box flexDirection="column">
				<Text>{ru.videoCrf}:</Text>
				<TextInput
					value={crfDraft}
					onChange={setCrfDraft}
					onSubmit={raw => {
						const n = Number(raw);
						if (Number.isFinite(n) && n >= 0 && n <= 51) {
							patch({
								videoCrf: Math.round(n),
								videoPreset: 'custom',
							});
							setSub('menu');
						}
					}}
				/>
			</Box>
		);
	}

	if (sub === 'height') {
		return (
			<Box flexDirection="column">
				<Text>{ru.videoHeight}</Text>
				<Select
					items={videoHeightChoices.map(c => ({
						label: c.label,
						value: c.value,
					}))}
					initialValue={settings.videoMaxHeight}
					onSelect={(v: VideoMaxHeight) => {
						patch({videoMaxHeight: v});
						setSub('menu');
					}}
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text>
				CRF: {settings.videoCrf}, высота:{' '}
				{settings.videoMaxHeight || 'исходное'}
			</Text>
			<Text>
				{ru.videosSmallFirst}: {settings.videosSmallFirst ? ru.yes : ru.no}
			</Text>
			<Text dimColor>{ru.videosSmallFirstHint}</Text>
			<Text>
				{ru.videoScanAllFormats}:{' '}
				{settings.videoScanAllFormats ? ru.on : ru.off}
			</Text>
			<Text dimColor>{ru.videoScanAllFormatsHint}</Text>
			<Select
				items={[
					{label: 'Пресет', value: 'preset'},
					{label: 'CRF числом', value: 'crf'},
					{label: 'Макс. высота', value: 'height'},
					{
						label: settings.videosSmallFirst
							? 'Выключить «сначала маленькие»'
							: 'Включить «сначала маленькие»',
						value: 'toggle-small-first',
					},
					{
						label: settings.videoScanAllFormats
							? `Выключить «${ru.videoScanAllFormats}»`
							: `Включить «${ru.videoScanAllFormats}»`,
						value: 'toggle-scan-formats',
					},
					{label: '→ Далее', value: 'next'},
				]}
				initialValue="next"
				onSelect={v => {
					if (v === 'next') {
						onNext();
						return;
					}

					if (v === 'toggle-small-first') {
						patch({videosSmallFirst: !settings.videosSmallFirst});
						return;
					}

					if (v === 'toggle-scan-formats') {
						patch({videoScanAllFormats: !settings.videoScanAllFormats});
						return;
					}

					setSub(v as typeof sub);
				}}
			/>
		</Box>
	);
}
