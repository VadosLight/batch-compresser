import React, {useEffect, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {
	runCompression,
	type ActiveJobProgress,
	type ProgressEvent,
} from './compress/run.js';
import {createDefaultSettings} from './defaults.js';
import {checkFfmpeg} from './ffmpeg.js';
import {
	detectInstallPlan,
	installFfmpeg,
	type FfmpegInstallPlan,
} from './ffmpeg-install.js';
import {loadProcessedPathsFromLogs} from './fs/previous-logs.js';
import {ru} from './i18n/ru.js';
import {scanDirectory} from './scan.js';
import BootScreen from './screens/BootScreen.js';
import ConfirmScreen from './screens/ConfirmScreen.js';
import FfmpegInstallingScreen from './screens/FfmpegInstallingScreen.js';
import FfmpegWarnScreen from './screens/FfmpegWarnScreen.js';
import RunningScreen from './screens/RunningScreen.js';
import ScanningScreen from './screens/ScanningScreen.js';
import SummaryScreen from './screens/SummaryScreen.js';
import type {CompressSettings, MediaKind, RunSummary} from './types.js';
import {
	nextWizardStep,
	prevWizardStep,
	wizardStepOrdinal,
	wizardStepTitle,
	type Screen,
} from './ui/types.js';
import Wizard from './wizard/Wizard.js';

type Props = {
	initialPath?: string;
};

type ProgressState = {
	done: number;
	total: number;
	current: string;
	kind?: MediaKind;
	status?: string;
	filePercent?: number;
	activeJobs: ActiveJobProgress[];
	bytesBefore: number;
	bytesAfter: number;
	videoWorkers?: number;
	resourceAdvice?: ProgressEvent['resourceAdvice'];
};

export default function App({initialPath}: Props) {
	const {exit} = useApp();
	const [screen, setScreen] = useState<Screen>('boot');
	const [ffmpegAvailable, setFfmpegAvailable] = useState(true);
	const [ffmpegLine, setFfmpegLine] = useState<string>();
	const [ffmpegInstallPlan, setFfmpegInstallPlan] = useState<
		FfmpegInstallPlan | undefined
	>();
	const [ffmpegInstallError, setFfmpegInstallError] = useState<string>();
	const [step, setStep] = useState(1);
	const [settings, setSettings] = useState<CompressSettings>(() =>
		createDefaultSettings(initialPath ?? ''),
	);
	const [pathDraft, setPathDraft] = useState(initialPath ?? '');
	const [error, setError] = useState<string>();
	const [scanCount, setScanCount] = useState(0);
	const [skipSmall, setSkipSmall] = useState(0);
	const [skipCompressed, setSkipCompressed] = useState(0);
	const [skipPrevious, setSkipPrevious] = useState(0);
	const [progress, setProgress] = useState<ProgressState>({
		done: 0,
		total: 0,
		current: '',
		activeJobs: [],
		bytesBefore: 0,
		bytesAfter: 0,
	});
	const [summary, setSummary] = useState<RunSummary>();
	const [skipVideo, setSkipVideo] = useState<(path: string) => void>();
	const [adjustVideoWorkers, setAdjustVideoWorkers] =
		useState<(n: number) => void>();

	useEffect(() => {
		void (async () => {
			const status = await checkFfmpeg();
			setFfmpegAvailable(status.available);
			setFfmpegLine(status.versionLine);
			if (!status.available) {
				setSettings(s => ({...s, processVideos: false}));
				const plan = await detectInstallPlan();
				setFfmpegInstallPlan(plan);
				setScreen('ffmpegWarn');
			} else {
				setScreen('wizard');
			}
		})();
	}, []);

	const continuePhotosOnly = () => {
		setSettings(s => ({...s, processVideos: false}));
		setFfmpegAvailable(false);
		setFfmpegInstallError(undefined);
		setScreen('wizard');
	};

	const runFfmpegInstall = async () => {
		if (!ffmpegInstallPlan) {
			continuePhotosOnly();
			return;
		}

		setFfmpegInstallError(undefined);
		setScreen('ffmpegInstalling');
		const result = await installFfmpeg(ffmpegInstallPlan);
		if (!result.ok) {
			setFfmpegInstallError(result.errorMessage);
			setScreen('ffmpegInstallFail');
			return;
		}

		const status = await checkFfmpeg();
		if (!status.available) {
			setFfmpegInstallError(ru.ffmpegMissing);
			setScreen('ffmpegInstallFail');
			return;
		}

		setFfmpegAvailable(true);
		setFfmpegLine(status.versionLine);
		setSettings(s => ({...s, processVideos: true}));
		setFfmpegInstallError(undefined);
		setScreen('wizard');
	};

	const patch = (partial: Partial<CompressSettings>) => {
		setSettings(s => ({...s, ...partial}));
	};

	const wizardCtx = {
		processPhotos: settings.processPhotos,
		processVideos: settings.processVideos,
		ffmpegAvailable,
	};
	const stepMeta = wizardStepOrdinal(step, wizardCtx);

	const goNext = () => {
		setError(undefined);
		setStep(s => nextWizardStep(s, wizardCtx));
	};

	const goBack = () => {
		setError(undefined);
		setStep(s => prevWizardStep(s, wizardCtx));
	};

	const validateAndScan = async () => {
		setError(undefined);

		if (!settings.rootDir) {
			setError(ru.pathError.empty);
			setStep(1);
			setScreen('wizard');
			return;
		}

		if (!settings.processPhotos && !settings.processVideos) {
			setError(ru.needMediaType);
			setStep(2);
			setScreen('wizard');
			return;
		}

		const next = {
			...settings,
			processVideos: settings.processVideos && ffmpegAvailable,
		};
		setSettings(next);
		setScreen('scanning');

		try {
			const {paths: processedPaths} = await loadProcessedPathsFromLogs(
				next.previousLogsPath,
			);
			const outcome = await scanDirectory(next, processedPaths);
			setScanCount(outcome.toProcess.length);
			setSkipSmall(outcome.skippedSmall.length);
			setSkipCompressed(outcome.skippedCompressed.length);
			setSkipPrevious(outcome.skippedPrevious.length);
			setScreen('confirm');
		} catch (error_) {
			setError(error_ instanceof Error ? error_.message : String(error_));
			setScreen('wizard');
		}
	};

	const startRun = async () => {
		setScreen('running');
		setSkipVideo(undefined);
		setAdjustVideoWorkers(undefined);
		setProgress({
			done: 0,
			total: scanCount,
			current: '',
			activeJobs: [],
			bytesBefore: 0,
			bytesAfter: 0,
		});
		try {
			const result = await runCompression(settings, {
				onControls(controls) {
					setSkipVideo(() => controls.skipVideo);
					setAdjustVideoWorkers(() => controls.setVideoWorkers);
				},
				onProgress(event) {
					setProgress({
						done: event.done,
						total: event.total,
						current: event.current,
						kind: event.kind,
						status: event.status,
						filePercent: event.filePercent,
						activeJobs: event.activeJobs,
						bytesBefore: event.bytesBefore,
						bytesAfter: event.bytesAfter,
						videoWorkers: event.videoWorkers,
						resourceAdvice: event.resourceAdvice,
					});
				},
			});
			setSkipVideo(undefined);
			setAdjustVideoWorkers(undefined);
			setSummary(result);
			setScreen('summary');
		} catch (error_) {
			setSkipVideo(undefined);
			setAdjustVideoWorkers(undefined);
			setError(error_ instanceof Error ? error_.message : String(error_));
			setScreen('wizard');
		}
	};

	useInput((_input, key) => {
		if (screen === 'ffmpegWarn') {
			if (key.return) {
				if (ffmpegInstallPlan) {
					void runFfmpegInstall();
				} else {
					continuePhotosOnly();
				}
			}

			if (key.escape) {
				continuePhotosOnly();
			}
		}

		if (screen === 'ffmpegInstallFail') {
			if (key.return) {
				void runFfmpegInstall();
			}

			if (key.escape) {
				continuePhotosOnly();
			}
		}

		if (screen === 'confirm') {
			if (key.return) {
				void startRun();
			}

			if (key.escape) {
				setScreen('wizard');
			}
		}

		if (screen === 'summary' && (key.return || key.escape)) {
			exit();
		}

		if (screen === 'wizard' && key.escape && step > 1) {
			goBack();
		}
	});

	if (screen === 'boot') {
		return <BootScreen />;
	}

	if (screen === 'ffmpegWarn') {
		return <FfmpegWarnScreen plan={ffmpegInstallPlan} />;
	}

	if (screen === 'ffmpegInstalling') {
		return <FfmpegInstallingScreen />;
	}

	if (screen === 'ffmpegInstallFail') {
		return <FfmpegInstallingScreen failed errorMessage={ffmpegInstallError} />;
	}

	if (screen === 'scanning') {
		return <ScanningScreen />;
	}

	if (screen === 'confirm') {
		return (
			<ConfirmScreen
				settings={settings}
				scanCount={scanCount}
				skipSmall={skipSmall}
				skipCompressed={skipCompressed}
				skipPrevious={skipPrevious}
			/>
		);
	}

	if (screen === 'running') {
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
				onSkipVideo={path => {
					skipVideo?.(path);
				}}
				onSetVideoWorkers={n => {
					adjustVideoWorkers?.(n);
				}}
			/>
		);
	}

	if (screen === 'summary' && summary) {
		return <SummaryScreen summary={summary} />;
	}

	return (
		<Box flexDirection="column">
			<Text bold>{ru.appTitle}</Text>
			{ffmpegAvailable && ffmpegLine ? (
				<Text dimColor>
					{ru.ffmpegOk}: {ffmpegLine}
				</Text>
			) : null}
			{error ? <Text color="red">{error}</Text> : null}
			<Box marginY={1}>
				<Text color="cyan">
					{ru.step(stepMeta.index, stepMeta.total, wizardStepTitle(step))}
				</Text>
			</Box>
			<Wizard
				step={step}
				settings={settings}
				pathDraft={pathDraft}
				ffmpegAvailable={ffmpegAvailable}
				setPathDraft={setPathDraft}
				patch={patch}
				onNext={goNext}
				onBack={goBack}
				onFinish={() => {
					void validateAndScan();
				}}
			/>
		</Box>
	);
}
