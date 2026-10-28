import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import Select from '../components/Select.js';
import {t} from '../i18n/index.js';
import {
	getPreset,
	qualityPresets,
	videoHeightChoices,
} from '../../core/presets.js';
import type {QualityPresetId, VideoMaxHeight} from '../../core/types.js';
import type {WizardNavProps} from '../../core/wizard-nav.js';

export default function VideoStep({settings, patch, onNext}: WizardNavProps) {
	const [sub, setSub] = useState<'menu' | 'preset' | 'crf' | 'height'>('menu');
	const [crfDraft, setCrfDraft] = useState(String(settings.videoCrf));

	if (sub === 'preset') {
		return (
			<Box flexDirection="column">
				<Text>{t.qualityPreset}</Text>
				<Select
					items={[
						...qualityPresets.map(p => ({
							label: `${p.label} (CRF=${p.videoCrf})`,
							value: p.id as QualityPresetId,
						})),
						{label: t.customPreset, value: 'custom' as QualityPresetId},
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
				<Text>{t.videoCrf}:</Text>
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
				<Text>{t.videoHeight}</Text>
				<Select
					items={videoHeightChoices.map(c => ({
						label: c.value === 0 ? t.heightSource : t.heightNp(c.value),
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
				{t.videoSummary(
					settings.videoCrf,
					settings.videoMaxHeight
						? String(settings.videoMaxHeight)
						: t.heightSource,
				)}
			</Text>
			<Text>
				{t.videosSmallFirst}: {settings.videosSmallFirst ? t.yes : t.no}
			</Text>
			<Text dimColor>{t.videosSmallFirstHint}</Text>
			<Text>
				{t.videoScanAllFormats}: {settings.videoScanAllFormats ? t.on : t.off}
			</Text>
			<Text dimColor>{t.videoScanAllFormatsHint}</Text>
			<Select
				items={[
					{label: t.menuPreset, value: 'preset'},
					{label: t.menuCrf, value: 'crf'},
					{label: t.menuHeight, value: 'height'},
					{
						label: settings.videosSmallFirst
							? t.toggleSmallFirstOff
							: t.toggleSmallFirstOn,
						value: 'toggle-small-first',
					},
					{
						label: settings.videoScanAllFormats
							? t.toggleScanAllOff(t.videoScanAllFormats)
							: t.toggleScanAllOn(t.videoScanAllFormats),
						value: 'toggle-scan-formats',
					},
					{label: t.nextArrow, value: 'next'},
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
