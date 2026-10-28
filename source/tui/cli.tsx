#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

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

render(<App initialPath={cli.flags.path} />);
