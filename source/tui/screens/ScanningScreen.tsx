import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {ru} from '../i18n/ru.js';

export default function ScanningScreen() {
	return (
		<Box>
			<Text>
				<Spinner type="dots" /> {ru.scanning}
			</Text>
		</Box>
	);
}
