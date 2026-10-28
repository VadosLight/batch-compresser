import React from 'react';
import type {CompressSettings} from '../../core/types.js';
import type {PatchSettings} from '../../core/wizard-nav.js';
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

	if (step === 4 && settings.processPhotos) {
		return <PhotoStep settings={settings} patch={patch} onNext={onNext} />;
	}

	if (step === 5 && settings.processVideos && ffmpegAvailable) {
		return <VideoStep settings={settings} patch={patch} onNext={onNext} />;
	}

	if (step === 6) {
		return <OutputStep settings={settings} patch={patch} onNext={onNext} />;
	}

	if (step === 7) {
		return <ReadyStep onBack={onBack} onFinish={onFinish} />;
	}

	// Disabled media step — navigation should have skipped it; advance as fallback.
	return null;
}
