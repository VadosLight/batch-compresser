import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';

export default function BootScreen() {
	return (
		<Box>
			<Text>
				<Spinner type="dots" /> Проверка ffmpeg…
			</Text>
		</Box>
	);
}
