import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {ru} from '../i18n/ru.js';
import type {MediaKind} from '../types.js';

type Props = {
	done: number;
	total: number;
	current: string;
	kind?: MediaKind;
	status?: string;
	filePercent?: number;
};

const progressBar = (percent: number, width = 20): string => {
	const clamped = Math.min(100, Math.max(0, percent));
	const filled = Math.round((clamped / 100) * width);
	return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}] ${clamped}%`;
};

const statusLabel = (
	kind: MediaKind | undefined,
	status: string | undefined,
): string => {
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

const kindSuffix = (kind: MediaKind | undefined): string => {
	if (kind === 'video') {
		return ` (${ru.kindVideo})`;
	}

	if (kind === 'photo') {
		return ` (${ru.kindPhoto})`;
	}

	return '';
};

export default function RunningScreen({
	done,
	total,
	current,
	kind,
	status,
	filePercent,
}: Props) {
	const showVideoProgress = kind === 'video' && filePercent !== undefined;
	const bar =
		showVideoProgress && filePercent !== undefined
			? progressBar(filePercent)
			: undefined;

	return (
		<Box flexDirection="column">
			<Text>
				<Spinner type="dots" /> {ru.progress(done, total, current)}
			</Text>
			<Text>
				{ru.fileStatus}: {statusLabel(kind, status)}
				{kindSuffix(kind)}
			</Text>
			{bar ? <Text color="cyan">{bar}</Text> : null}
		</Box>
	);
}
