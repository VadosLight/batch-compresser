import React, {useEffect, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import Spinner from 'ink-spinner';
import type {
	ActiveJobProgress,
	ProgressEvent,
} from '../../core/compress/run.js';
import {t} from '../i18n/index.js';
import type {MediaKind} from '../../core/types.js';
import {formatJobLabel} from '../ui/job-label.js';

type ResourceAdvice = NonNullable<ProgressEvent['resourceAdvice']>;

type Props = {
	done: number;
	total: number;
	current: string;
	kind?: MediaKind;
	status?: string;
	filePercent?: number;
	activeJobs?: ActiveJobProgress[];
	bytesBefore?: number;
	bytesAfter?: number;
	videoWorkers?: number;
	resourceAdvice?: ResourceAdvice;
	onSkipVideo?: (path: string) => void;
	onSetVideoWorkers?: (n: number) => void;
	onOpenFolder?: (path: string) => void;
	openFolderError?: string;
};

const progressBar = (percent: number, width = 16): string => {
	const clamped = Math.min(100, Math.max(0, percent));
	const filled = Math.round((clamped / 100) * width);
	return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}] ${clamped}%`;
};

const statusLabel = (
	kind: MediaKind | undefined,
	status: string | undefined,
): string => {
	if (status === 'stage') {
		return t.videoStatusStage;
	}

	if (kind === 'video') {
		switch (status) {
			case 'probe': {
				return t.videoStatusProbe;
			}

			case 'encode': {
				return t.videoStatusEncode;
			}

			case 'finalize': {
				return t.videoStatusFinalize;
			}

			case 'done': {
				return t.videoStatusDone;
			}

			default: {
				return t.videoStatusEncode;
			}
		}
	}

	if (kind === 'photo') {
		return t.photoStatusCompress;
	}

	return t.processing;
};

const adviceLabel = (advice: ResourceAdvice['advice']): string => {
	switch (advice) {
		case 'increase': {
			return t.workerAdviceIncrease;
		}

		case 'decrease': {
			return t.workerAdviceDecrease;
		}

		default: {
			return t.workerAdviceOk;
		}
	}
};

export default function RunningScreen({
	done,
	total,
	current,
	kind,
	status,
	filePercent,
	activeJobs = [],
	bytesBefore = 0,
	bytesAfter = 0,
	videoWorkers,
	resourceAdvice,
	onSkipVideo,
	onSetVideoWorkers,
	onOpenFolder,
	openFolderError,
}: Props) {
	const jobs =
		activeJobs.length > 0
			? activeJobs
			: current
			? [
					{
						path: current,
						kind: kind ?? 'photo',
						status: status ?? 'compress',
						filePercent: filePercent ?? 0,
					},
			  ]
			: [];

	const videoJobs = jobs.filter(job => job.kind === 'video');
	const videoPathsKey = videoJobs.map(job => job.path).join('\0');
	const [focusedPath, setFocusedPath] = useState<string>();
	const [confirmSkip, setConfirmSkip] = useState(false);

	useEffect(() => {
		const paths = videoPathsKey ? videoPathsKey.split('\0') : [];
		if (paths.length === 0) {
			setFocusedPath(undefined);
			setConfirmSkip(false);
			return;
		}

		if (!focusedPath || !paths.includes(focusedPath)) {
			setFocusedPath(paths[0]);
			setConfirmSkip(false);
		}
	}, [videoPathsKey, focusedPath]);

	useInput((input, key) => {
		if (confirmSkip) {
			if (key.return && focusedPath) {
				onSkipVideo?.(focusedPath);
				setConfirmSkip(false);
			}

			if (key.escape) {
				setConfirmSkip(false);
			}

			return;
		}

		if (input === '[' && videoWorkers !== undefined) {
			onSetVideoWorkers?.(Math.max(1, videoWorkers - 1));
			return;
		}

		if (input === ']' && videoWorkers !== undefined) {
			onSetVideoWorkers?.(videoWorkers + 1);
			return;
		}

		if (videoJobs.length === 0) {
			return;
		}

		if (key.upArrow || key.downArrow) {
			const index = videoJobs.findIndex(job => job.path === focusedPath);
			const currentIndex = index >= 0 ? index : 0;
			const nextIndex = key.upArrow
				? (currentIndex - 1 + videoJobs.length) % videoJobs.length
				: (currentIndex + 1) % videoJobs.length;
			setFocusedPath(videoJobs[nextIndex]?.path);
			return;
		}

		if ((input === 's' || input === 'S') && focusedPath) {
			setConfirmSkip(true);
			return;
		}

		if ((input === 'o' || input === 'O') && focusedPath) {
			onOpenFolder?.(focusedPath);
		}
	});

	const saved = Math.max(0, bytesBefore - bytesAfter);
	const savedPct = bytesBefore > 0 ? (saved / bytesBefore) * 100 : 0;
	const showWorkers =
		videoWorkers !== undefined && resourceAdvice !== undefined;

	return (
		<Box flexDirection="column">
			<Text>
				<Spinner type="dots" /> {t.batchProgress(done, total)}
				{done > 0
					? ` · ${t.batchSaved(bytesBefore, bytesAfter, saved, savedPct)}`
					: ''}
			</Text>
			<Text>
				{t.activeJobs}: {jobs.length}
			</Text>
			{showWorkers ? (
				<Text>
					{t.videoWorkersLive(videoWorkers)}
					{' · '}
					{t.resourceLoad(resourceAdvice.loadPerCore, resourceAdvice.cpuCount)}
					{' · '}
					{adviceLabel(resourceAdvice.advice)}
				</Text>
			) : null}
			{videoJobs.length > 0 || showWorkers ? (
				<Text dimColor>{t.skipHint}</Text>
			) : null}
			{openFolderError ? <Text color="red">{openFolderError}</Text> : null}
			{confirmSkip && focusedPath ? (
				<Text color="yellow">{t.skipConfirm(formatJobLabel(focusedPath))}</Text>
			) : null}
			{jobs.map(job => {
				const focused = job.kind === 'video' && job.path === focusedPath;
				return (
					<Box key={job.path} flexDirection="column" marginTop={1}>
						<Text color={focused ? 'yellow' : undefined}>
							{focused ? '> ' : '  '}
							{formatJobLabel(job.path)} — {statusLabel(job.kind, job.status)}
							{job.kind === 'video' ? ` (${t.kindVideo})` : ` (${t.kindPhoto})`}
						</Text>
						{job.kind === 'video' ? (
							<Text color="cyan">{progressBar(job.filePercent)}</Text>
						) : null}
					</Box>
				);
			})}
		</Box>
	);
}
