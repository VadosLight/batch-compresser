import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {ru} from '../i18n/ru.js';

type Props = {
	done: number;
	total: number;
	current: string;
};

export default function RunningScreen({done, total, current}: Props) {
	return (
		<Box flexDirection="column">
			<Text>
				<Spinner type="dots" /> {ru.progress(done, total, current)}
			</Text>
		</Box>
	);
}
