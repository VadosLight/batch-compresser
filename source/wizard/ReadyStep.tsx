import React from 'react';
import {Box, Text} from 'ink';
import Select from '../components/Select.js';

type Props = {
	onBack: () => void;
	onFinish: () => void;
};

export default function ReadyStep({onBack, onFinish}: Props) {
	return (
		<Box flexDirection="column">
			<Text>Проверьте настройки и запустите сканирование.</Text>
			<Select
				items={[
					{label: '← Назад', value: 'back'},
					{label: 'Сканировать и подтвердить', value: 'go'},
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
