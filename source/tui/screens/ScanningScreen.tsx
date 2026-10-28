import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {t} from '../i18n/index.js';

export default function ScanningScreen() {
	return (
		<Box>
			<Text>
				<Spinner type="dots" /> {t.scanning}
			</Text>
		</Box>
	);
}
