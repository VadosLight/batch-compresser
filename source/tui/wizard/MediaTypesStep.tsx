import React from 'react';
import {Box, Text} from 'ink';
import Select from '../components/Select.js';
import {t} from '../i18n/index.js';
import type {WizardNavProps} from '../../core/wizard-nav.js';

type Props = WizardNavProps & {
	ffmpegAvailable: boolean;
};

export default function MediaTypesStep({
	settings,
	patch,
	onNext,
	ffmpegAvailable,
}: Props) {
	return (
		<Box flexDirection="column">
			<Text>
				{t.mediaSummary(
					settings.processPhotos ? t.yes : t.no,
					settings.processVideos ? t.yes : t.no,
				)}
			</Text>
			<Select
				items={[
					{
						label: settings.processPhotos ? t.togglePhotoOff : t.togglePhotoOn,
						value: 'toggle-photo',
					},
					{
						label: settings.processVideos
							? t.toggleVideoOff
							: ffmpegAvailable
								? t.toggleVideoOn
								: t.toggleVideoNoFfmpeg,
						value: 'toggle-video',
					},
					{label: t.nextArrow, value: 'next'},
				]}
				initialValue="next"
				onSelect={v => {
					if (v === 'toggle-photo') {
						patch({processPhotos: !settings.processPhotos});
					}

					if (v === 'toggle-video' && ffmpegAvailable) {
						patch({processVideos: !settings.processVideos});
					}

					if (v === 'next') {
						onNext();
					}
				}}
			/>
		</Box>
	);
}
