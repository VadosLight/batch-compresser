import React from 'react';
import {Box, Text} from 'ink';
import Select from '../components/Select.js';
import type {CompressSettings} from '../types.js';
import type {PatchSettings} from '../ui/types.js';
import MediaTypesStep from './MediaTypesStep.js';
import OutputStep from './OutputStep.js';
import PathStep from './PathStep.js';
import PhotoStep from './PhotoStep.js';
import ReadyStep from './ReadyStep.js';
import ThresholdStep from './ThresholdStep.js';
import VideoStep from './VideoStep.js';

type Props = {
	step: number;
	settings: CompressSettings;
	pathDraft: string;
	ffmpegAvailable: boolean;
	setPathDraft: (value: string) => void;
	patch: PatchSettings;
	onNext: () => void;
	onBack: () => void;
	onFinish: () => void;
};

export default function Wizard({
	step,
	settings,
	pathDraft,
	ffmpegAvailable,
	setPathDraft,
	patch,
	onNext,
	onBack,
	onFinish,
}: Props) {
	if (step === 1) {
		return (
			<PathStep
				pathDraft={pathDraft}
				setPathDraft={setPathDraft}
				patch={patch}
				onNext={onNext}
			/>
		);
	}

	if (step === 2) {
		return (
			<MediaTypesStep
				settings={settings}
				ffmpegAvailable={ffmpegAvailable}
				patch={patch}
				onNext={onNext}
			/>
		);
	}

	if (step === 3) {
		return <ThresholdStep settings={settings} patch={patch} onNext={onNext} />;
	}

	if (step === 4) {
		return <PhotoStep settings={settings} patch={patch} onNext={onNext} />;
	}

	if (step === 5) {
		if (!ffmpegAvailable || !settings.processVideos) {
			return (
				<Box flexDirection="column">
					<Text dimColor>Видео отключено — пропуск настроек.</Text>
					<Select
						items={[{label: '→ Далее', value: 'next'}]}
						onSelect={onNext}
					/>
				</Box>
			);
		}

		return <VideoStep settings={settings} patch={patch} onNext={onNext} />;
	}

	if (step === 6) {
		return <OutputStep settings={settings} patch={patch} onNext={onNext} />;
	}

	return <ReadyStep onBack={onBack} onFinish={onFinish} />;
}
