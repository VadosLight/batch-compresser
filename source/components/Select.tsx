import React, {useEffect, useRef, useState} from 'react';
import {Box, Text, useInput} from 'ink';

export type SelectItem<T extends string | number | boolean> = {
	label: string;
	value: T;
};

type Props<T extends string | number | boolean> = {
	items: ReadonlyArray<SelectItem<T>>;
	initialValue?: T;
	onSelect: (value: T) => void;
};

export default function Select<T extends string | number | boolean>({
	items,
	initialValue,
	onSelect,
}: Props<T>) {
	const initial = Math.max(
		0,
		initialValue === undefined
			? 0
			: items.findIndex(i => i.value === initialValue),
	);
	const [index, setIndex] = useState(initial < 0 ? 0 : initial);
	const indexRef = useRef(index);
	const onSelectRef = useRef(onSelect);
	const itemsRef = useRef(items);

	useEffect(() => {
		onSelectRef.current = onSelect;
	}, [onSelect]);

	useEffect(() => {
		itemsRef.current = items;
	}, [items]);

	useEffect(() => {
		indexRef.current = index;
	}, [index]);

	useInput((_input, key) => {
		const list = itemsRef.current;
		if (key.upArrow) {
			setIndex(i => {
				const next = (i - 1 + list.length) % list.length;
				indexRef.current = next;
				return next;
			});
		}

		if (key.downArrow) {
			setIndex(i => {
				const next = (i + 1) % list.length;
				indexRef.current = next;
				return next;
			});
		}

		if (key.return) {
			const item = list[indexRef.current];
			if (item) {
				onSelectRef.current(item.value);
			}
		}
	});

	return (
		<Box flexDirection="column">
			{items.map((item, i) => (
				<Text
					key={`${String(item.value)}-${i}`}
					color={i === index ? 'cyan' : undefined}
				>
					{i === index ? '❯ ' : '  '}
					{item.label}
				</Text>
			))}
		</Box>
	);
}
