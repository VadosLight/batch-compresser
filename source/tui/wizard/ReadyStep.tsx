import React from 'react';
import {Box, Text} from 'ink';
import Select from '../components/Select.js';
import {t} from '../i18n/index.js';

type Props = {
	onBack: () => void;
	onFinish: () => void;
};

export default function ReadyStep({onBack, onFinish}: Props) {
	return (
		<Box flexDirection="column">
			<Text>{t.readyHint}</Text>
			<Select
				items={[
					{label: t.backArrow, value: 'back'},
					{label: t.goScan, value: 'go'},
				]}
				initialValue="go"
				onSelect={v => {
					if (v === 'back') {
						onBack();
					}

					if (v === 'go') {
						onFinish();
					}
				}}
			/>
		</Box>
	);
}
