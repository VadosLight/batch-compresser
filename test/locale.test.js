import test from 'ava';
import {
	getMessages,
	isNeutralLocaleTag,
	resolveUiLocale,
} from '../dist/tui/i18n/index.js';

test('resolveUiLocale picks Russian from LANG', t => {
	t.is(
		resolveUiLocale({LANG: 'ru_RU.UTF-8'}, undefined, {skipOsLocale: true}),
		'ru',
	);
	t.is(resolveUiLocale({LANG: 'ru'}, undefined, {skipOsLocale: true}), 'ru');
	t.is(
		resolveUiLocale({LC_MESSAGES: 'ru-RU'}, undefined, {skipOsLocale: true}),
		'ru',
	);
});

test('resolveUiLocale defaults to English', t => {
	t.is(
		resolveUiLocale({LANG: 'en_US.UTF-8'}, undefined, {skipOsLocale: true}),
		'en',
	);
	t.is(resolveUiLocale({LANG: 'C'}, undefined, {skipOsLocale: true}), 'en');
	t.is(
		resolveUiLocale({LANG: 'de_DE.UTF-8'}, undefined, {skipOsLocale: true}),
		'en',
	);
	t.is(resolveUiLocale({}, 'fr-FR', {skipOsLocale: true}), 'en');
});

test('LC_ALL overrides LANG', t => {
	t.is(
		resolveUiLocale({LANG: 'en_US.UTF-8', LC_ALL: 'ru_RU.UTF-8'}, undefined, {
			skipOsLocale: true,
		}),
		'ru',
	);
});

test('C.UTF-8 LANG falls through to os-locale tag', t => {
	t.true(isNeutralLocaleTag('C.UTF-8'));
	t.is(
		resolveUiLocale({LANG: 'C.UTF-8'}, 'en-US', {osLocaleTag: 'ru-RU'}),
		'ru',
	);
	t.is(
		resolveUiLocale({LANG: 'C.UTF-8'}, 'en-US', {osLocaleTag: 'en-US'}),
		'en',
	);
});

test('osLocaleTag used when env is unset', t => {
	t.is(resolveUiLocale({}, 'en-US', {osLocaleTag: 'ru_RU'}), 'ru');
});

test('getMessages returns localized app title', t => {
	t.true(getMessages('ru').appTitle.includes('массовое'));
	t.true(getMessages('en').appTitle.includes('batch'));
	t.is(getMessages('en').nextArrow, '→ Next');
	t.is(getMessages('ru').nextArrow, '→ Далее');
});
