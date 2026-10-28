#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './App.js';
import {createSessionPresenter} from './wire.js';

const cli = meow(
	`
	Использование
	  $ batch-compresser

	Опции
	  --path, -p  Начальный путь к папке

	Примеры
	  $ batch-compresser
	  $ batch-compresser --path ~/Pictures
`,
	{
		importMeta: import.meta,
		flags: {
			path: {
				type: 'string',
				alias: 'p',
			},
		},
	},
);

const presenter = createSessionPresenter(cli.flags.path);
render(<App presenter={presenter} />);
