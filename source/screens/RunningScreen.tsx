import path from 'node:path';
import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import type {ActiveJobProgress} from '../compress/run.js';
import {ru} from '../i18n/ru.js';
import type {MediaKind} from '../types.js';

type Props = {
	done: number;
	total: number;
	current: string;
	kind?: MediaKind;
	status?: string;
	filePercent?: number;
	activeJobs?: ActiveJobProgress[];
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

export default function RunningScreen({
	done,
	total,
	current,
	kind,
	status,
	filePercent,
	activeJobs = [],
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

	return (
		<Box flexDirection="column">
			<Text>
				<Spinner type="dots" /> {ru.batchProgress(done, total)}
			</Text>
			<Text>
				{ru.activeJobs}: {jobs.length}
			</Text>
			{jobs.map(job => (
				<Box key={job.path} flexDirection="column" marginTop={1}>
					<Text>
						{shortName(job.path)} — {statusLabel(job.kind, job.status)}
						{job.kind === 'video' ? ` (${ru.kindVideo})` : ` (${ru.kindPhoto})`}
					</Text>
					{job.kind === 'video' ? (
						<Text color="cyan">{progressBar(job.filePercent)}</Text>
					) : null}
				</Box>
			))}
		</Box>
	);
}
