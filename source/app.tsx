import React, {useEffect, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {runCompression, type ActiveJobProgress} from './compress/run.js';
import {createDefaultSettings} from './defaults.js';
import {checkFfmpeg} from './ffmpeg.js';
import {loadProcessedPathsFromLogs} from './fs/previous-logs.js';
import {ru} from './i18n/ru.js';
import {scanDirectory} from './scan.js';
import BootScreen from './screens/BootScreen.js';
import ConfirmScreen from './screens/ConfirmScreen.js';
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
};

export default function App({initialPath}: Props) {
	const {exit} = useApp();
	const [screen, setScreen] = useState<Screen>('boot');
	const [ffmpegAvailable, setFfmpegAvailable] = useState(true);
	const [ffmpegLine, setFfmpegLine] = useState<string>();
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

	useEffect(() => {
		void (async () => {
			const status = await checkFfmpeg();
			setFfmpegAvailable(status.available);
			setFfmpegLine(status.versionLine);
			if (!status.available) {
				setSettings(s => ({...s, processVideos: false}));
				setScreen('ffmpegWarn');
			} else {
				setScreen('wizard');
			}
		})();
	}, []);

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
					});
				},
			});
			setSkipVideo(undefined);
			setSummary(result);
			setScreen('summary');
		} catch (error_) {
			setSkipVideo(undefined);
			setError(error_ instanceof Error ? error_.message : String(error_));
			setScreen('wizard');
		}
	};

	useInput((_input, key) => {
		if (screen === 'ffmpegWarn' && key.return) {
			setScreen('wizard');
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
		return <FfmpegWarnScreen />;
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
				onSkipVideo={path => {
					skipVideo?.(path);
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
