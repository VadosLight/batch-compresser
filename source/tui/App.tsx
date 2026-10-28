import React, {useEffect, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import type {SessionPresenter} from '../core/app/SessionPresenter.js';
import type {AppViewModel} from '../core/app/view-model.js';
import {wizardStepOrdinal} from '../core/wizard-nav.js';
import {t} from './i18n/index.js';
import BootScreen from './screens/BootScreen.js';
import ConfirmScreen from './screens/ConfirmScreen.js';
import FfmpegInstallingScreen from './screens/FfmpegInstallingScreen.js';
import FfmpegWarnScreen from './screens/FfmpegWarnScreen.js';
import RunningScreen from './screens/RunningScreen.js';
import ScanningScreen from './screens/ScanningScreen.js';
import SummaryScreen from './screens/SummaryScreen.js';
import {wizardStepTitle} from './ui/wizard-titles.js';
import Wizard from './wizard/Wizard.js';

type Props = {
	presenter: SessionPresenter;
};

export default function App({presenter}: Props) {
	const {exit} = useApp();
	const [vm, setVm] = useState<AppViewModel>(() => presenter.getViewModel());

	useEffect(() => presenter.subscribe(setVm), [presenter]);

	useEffect(() => {
		void presenter.start();
	}, [presenter]);

	const wizardCtx = {
		processPhotos: vm.settings.processPhotos,
		processVideos: vm.settings.processVideos,
		ffmpegAvailable: vm.ffmpeg.available,
	};
	const stepMeta = wizardStepOrdinal(vm.wizardStep, wizardCtx);

	useInput((_input, key) => {
		if (vm.screen === 'ffmpegWarn') {
			if (key.return) {
				if (vm.ffmpeg.installPlan) {
					void presenter.installFfmpeg();
				} else {
					presenter.continuePhotosOnly();
				}
			}

			if (key.escape) {
				presenter.continuePhotosOnly();
			}

			return;
		}

		if (vm.screen === 'ffmpegInstallFail') {
			if (key.return) {
				void presenter.installFfmpeg();
			}

			if (key.escape) {
				presenter.continuePhotosOnly();
			}

			return;
		}

		if (vm.screen === 'confirm') {
			if (key.return) {
				void presenter.confirmStart();
			}

			if (key.escape) {
				presenter.confirmCancel();
			}

			return;
		}

		if (vm.screen === 'summary' && (key.return || key.escape)) {
			exit();
			return;
		}

		if (vm.screen === 'wizard' && key.escape && vm.wizardStep > 1) {
			presenter.wizardBack();
		}
	});

	if (vm.screen === 'boot') {
		return <BootScreen />;
	}

	if (vm.screen === 'ffmpegWarn') {
		return <FfmpegWarnScreen plan={vm.ffmpeg.installPlan} />;
	}

	if (vm.screen === 'ffmpegInstalling') {
		return <FfmpegInstallingScreen />;
	}

	if (vm.screen === 'ffmpegInstallFail') {
		return (
			<FfmpegInstallingScreen
				failed
				errorMessage={
					vm.ffmpeg.installError === 'ffmpeg_still_missing'
						? t.ffmpegMissing
						: vm.ffmpeg.installError
				}
			/>
		);
	}

	if (vm.screen === 'scanning') {
		return <ScanningScreen />;
	}

	if (vm.screen === 'confirm' && vm.scan) {
		return (
			<ConfirmScreen
				settings={vm.settings}
				scanCount={vm.scan.count}
				skipSmall={vm.scan.skipSmall}
				skipCompressed={vm.scan.skipCompressed}
				skipPrevious={vm.scan.skipPrevious}
			/>
		);
	}

	if (vm.screen === 'running' && vm.progress) {
		const {progress} = vm;
		return (
			<RunningScreen
				done={progress.done}
				total={progress.total}
				current={progress.current}
				kind={progress.kind}
				status={progress.status}
				filePercent={progress.filePercent}
				activeJobs={progress.activeJobs}
				bytesBefore={progress.bytesBefore}
				bytesAfter={progress.bytesAfter}
				videoWorkers={progress.videoWorkers}
				resourceAdvice={progress.resourceAdvice}
				openFolderError={vm.openFolderError ? t.openFolderFailed : undefined}
				onSkipVideo={path => {
					presenter.skipVideo(path);
				}}
				onSetVideoWorkers={n => {
					presenter.setVideoWorkers(n);
				}}
				onOpenFolder={filePath => {
					void presenter.openContainingFolder(filePath);
				}}
			/>
		);
	}

	if (vm.screen === 'summary' && vm.summary) {
		return <SummaryScreen summary={vm.summary} />;
	}

	const errorText = (() => {
		if (!vm.error) {
			return undefined;
		}

		if (vm.error === 'path_empty') {
			return t.pathError.empty;
		}

		if (vm.error === 'need_media_type') {
			return t.needMediaType;
		}

		if (vm.error.startsWith('path_')) {
			const reason = vm.error.slice('path_'.length);
			if (reason === 'empty') {
				return t.pathError.empty;
			}

			if (reason === 'missing') {
				return t.pathError.missing;
			}

			if (reason === 'notDirectory') {
				return t.pathError.notDirectory;
			}

			if (reason === 'unreadable') {
				return t.pathError.unreadable;
			}
		}

		if (vm.error.startsWith('previous_logs_')) {
			const reason = vm.error.slice('previous_logs_'.length);
			if (
				reason === 'empty' ||
				reason === 'missing' ||
				reason === 'unreadable' ||
				reason === 'notLogsPath'
			) {
				return t.previousLogsError[reason];
			}
		}

		return vm.error;
	})();

	return (
		<Box flexDirection="column">
			<Text bold>{t.appTitle}</Text>
			{vm.ffmpeg.available && vm.ffmpeg.versionLine ? (
				<Text dimColor>
					{t.ffmpegOk}: {vm.ffmpeg.versionLine}
				</Text>
			) : null}
			{errorText ? <Text color="red">{errorText}</Text> : null}
			<Box marginY={1}>
				<Text color="cyan">
					{t.step(
						stepMeta.index,
						stepMeta.total,
						wizardStepTitle(vm.wizardStep),
					)}
				</Text>
			</Box>
			<Wizard
				step={vm.wizardStep}
				settings={vm.settings}
				pathDraft={vm.pathDraft}
				ffmpegAvailable={vm.ffmpeg.available}
				setPathDraft={draft => {
					presenter.setPathDraft(draft);
				}}
				patch={partial => {
					presenter.patchSettings(partial);
				}}
				onNext={() => {
					presenter.wizardNext();
				}}
				onBack={() => {
					presenter.wizardBack();
				}}
				onFinish={() => {
					void presenter.finishWizard();
				}}
			/>
		</Box>
	);
}
