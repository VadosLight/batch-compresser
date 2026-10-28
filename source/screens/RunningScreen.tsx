import path from 'node:path';
import React, {useEffect, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import Spinner from 'ink-spinner';
import type {ActiveJobProgress, ProgressEvent} from '../compress/run.js';
import {ru} from '../i18n/ru.js';
import type {MediaKind} from '../types.js';

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
		return ru.videoStatusStage;
	}

	if (kind === 'video') {
		switch (status) {
			case 'probe': {
				return ru.videoStatusProbe;
			}

			case 'encode': {
				return ru.videoStatusEncode;
			}

			case 'finalize': {
				return ru.videoStatusFinalize;
			}

			case 'done': {
				return ru.videoStatusDone;
			}

			default: {
				return ru.videoStatusEncode;
			}
		}
	}

	if (kind === 'photo') {
		return ru.photoStatusCompress;
	}

	return ru.processing;
};

const shortName = (filePath: string): string => path.basename(filePath);

const adviceLabel = (advice: ResourceAdvice['advice']): string => {
	switch (advice) {
		case 'increase': {
			return ru.workerAdviceIncrease;
		}

		case 'decrease': {
			return ru.workerAdviceDecrease;
		}

		default: {
			return ru.workerAdviceOk;
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
		}
	});

	const saved = Math.max(0, bytesBefore - bytesAfter);
	const savedPct = bytesBefore > 0 ? (saved / bytesBefore) * 100 : 0;
	const showWorkers =
		videoWorkers !== undefined && resourceAdvice !== undefined;

	return (
		<Box flexDirection="column">
			<Text>
				<Spinner type="dots" /> {ru.batchProgress(done, total)}
				{done > 0
					? ` · ${ru.batchSaved(bytesBefore, bytesAfter, saved, savedPct)}`
					: ''}
			</Text>
			<Text>
				{ru.activeJobs}: {jobs.length}
			</Text>
			{showWorkers ? (
				<Text>
					{ru.videoWorkersLive(videoWorkers)}
					{' · '}
					{ru.resourceLoad(resourceAdvice.load1, resourceAdvice.cpuCount)}
					{' · '}
					{adviceLabel(resourceAdvice.advice)}
				</Text>
			) : null}
			{videoJobs.length > 0 || showWorkers ? (
				<Text dimColor>{ru.skipHint}</Text>
			) : null}
			{confirmSkip && focusedPath ? (
				<Text color="yellow">{ru.skipConfirm(shortName(focusedPath))}</Text>
			) : null}
			{jobs.map(job => {
				const focused = job.kind === 'video' && job.path === focusedPath;
				return (
					<Box key={job.path} flexDirection="column" marginTop={1}>
						<Text color={focused ? 'yellow' : undefined}>
							{focused ? '> ' : '  '}
							{shortName(job.path)} — {statusLabel(job.kind, job.status)}
							{job.kind === 'video'
								? ` (${ru.kindVideo})`
								: ` (${ru.kindPhoto})`}
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
