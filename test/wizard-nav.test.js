import test from 'ava';
import {
	isWizardStepEnabled,
	nextWizardStep,
	prevWizardStep,
	visibleWizardSteps,
	wizardStepOrdinal,
} from '../dist/ui/types.js';

const both = {
	processPhotos: true,
	processVideos: true,
	ffmpegAvailable: true,
};

const photosOnly = {
	processPhotos: true,
	processVideos: false,
	ffmpegAvailable: true,
};

const videosOnly = {
	processPhotos: false,
	processVideos: true,
	ffmpegAvailable: true,
};

const videosNoFfmpeg = {
	processPhotos: true,
	processVideos: true,
	ffmpegAvailable: false,
};

test('visibleWizardSteps skips disabled media', t => {
	t.deepEqual(visibleWizardSteps(both), [1, 2, 3, 4, 5, 6, 7]);
	t.deepEqual(visibleWizardSteps(photosOnly), [1, 2, 3, 4, 6, 7]);
	t.deepEqual(visibleWizardSteps(videosOnly), [1, 2, 3, 5, 6, 7]);
	t.deepEqual(visibleWizardSteps(videosNoFfmpeg), [1, 2, 3, 4, 6, 7]);
});

test('next/prev skip photo and video steps when off', t => {
	t.is(nextWizardStep(3, photosOnly), 4);
	t.is(nextWizardStep(4, photosOnly), 6);
	t.is(prevWizardStep(6, photosOnly), 4);
	t.is(prevWizardStep(6, videosOnly), 5);
	t.is(nextWizardStep(3, videosOnly), 5);
	t.false(isWizardStepEnabled(4, videosOnly));
	t.false(isWizardStepEnabled(5, photosOnly));
});

test('wizardStepOrdinal uses visible count', t => {
	t.deepEqual(wizardStepOrdinal(6, photosOnly), {index: 5, total: 6});
	t.deepEqual(wizardStepOrdinal(4, both), {index: 4, total: 7});
});
