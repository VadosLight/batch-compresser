#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import {t} from './i18n/index.js';
import App from './App.js';
import {createSessionPresenter} from './wire.js';

const cli = meow(t.cliHelp, {
	importMeta: import.meta,
	flags: {
		path: {
			type: 'string',
			alias: 'p',
		},
	},
});

const presenter = createSessionPresenter(cli.flags.path);
render(<App presenter={presenter} />);
