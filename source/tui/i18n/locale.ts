import process from 'node:process';
import osLocale from 'os-locale';
import type {UiLocale} from './types.js';

export type {UiLocale} from './types.js';

const systemIntlLocale = (): string => {
	const {DateTimeFormat} = Intl;
	return new DateTimeFormat().resolvedOptions().locale;
};

/** True for unset / POSIX / C locales that do not reflect UI language. */
export const isNeutralLocaleTag = (raw: string): boolean => {
	const normalized = raw.trim().toLowerCase().replaceAll('_', '-');
	if (!normalized) {
		return true;
	}

	const primary = normalized.split(/[.-]/)[0] ?? '';
	return primary === 'c' || primary === 'posix';
};

const primaryLanguage = (raw: string): string => {
	const normalized = raw.trim().toLowerCase().replaceAll('_', '-');
	return normalized.split(/[.-]/)[0] ?? '';
};

const envLocaleTag = (env: NodeJS.ProcessEnv): string | undefined =>
	env['LC_ALL'] ?? env['LC_MESSAGES'] ?? env['LANG'] ?? env['LANGUAGE'];

const toUiLocale = (tag: string): UiLocale =>
	primaryLanguage(tag) === 'ru' ? 'ru' : 'en';

/**
 * os-locale@5 reads AppleLocale when locale env vars are unset.
 * Terminals often set LANG=C.UTF-8 — treat that as unset so spawn path runs.
 */
export const readOsLocale = (): string => {
	const current = envLocaleTag(process.env);
	if (current && !isNeutralLocaleTag(current)) {
		return osLocale.sync({spawn: false});
	}

	const saved = {
		LC_ALL: process.env['LC_ALL'],
		LC_MESSAGES: process.env['LC_MESSAGES'],
		LANG: process.env['LANG'],
		LANGUAGE: process.env['LANGUAGE'],
	};

	Reflect.deleteProperty(process.env, 'LC_ALL');
	Reflect.deleteProperty(process.env, 'LC_MESSAGES');
	Reflect.deleteProperty(process.env, 'LANG');
	Reflect.deleteProperty(process.env, 'LANGUAGE');

	try {
		return osLocale.sync({spawn: true});
	} finally {
		if (saved.LC_ALL === undefined) {
			Reflect.deleteProperty(process.env, 'LC_ALL');
		} else {
			process.env['LC_ALL'] = saved.LC_ALL;
		}

		if (saved.LC_MESSAGES === undefined) {
			Reflect.deleteProperty(process.env, 'LC_MESSAGES');
		} else {
			process.env['LC_MESSAGES'] = saved.LC_MESSAGES;
		}

		if (saved.LANG === undefined) {
			Reflect.deleteProperty(process.env, 'LANG');
		} else {
			process.env['LANG'] = saved.LANG;
		}

		if (saved.LANGUAGE === undefined) {
			Reflect.deleteProperty(process.env, 'LANGUAGE');
		} else {
			process.env['LANGUAGE'] = saved.LANGUAGE;
		}
	}
};

export type ResolveUiLocaleOptions = {
	/** Override tag (tests), skipping os-locale. */
	osLocaleTag?: string;
	/** When true, do not call os-locale (tests). */
	skipOsLocale?: boolean;
};

/**
 * Pick UI language via os-locale (env + OS), then Intl.
 * Russian when the primary language tag is `ru`; otherwise English.
 */
export const resolveUiLocale = (
	env: NodeJS.ProcessEnv = process.env,
	intlLocale?: string,
	options: ResolveUiLocaleOptions = {},
): UiLocale => {
	if (options.osLocaleTag !== undefined) {
		return isNeutralLocaleTag(options.osLocaleTag)
			? 'en'
			: toUiLocale(options.osLocaleTag);
	}

	const fromEnv = envLocaleTag(env);
	if (fromEnv && !isNeutralLocaleTag(fromEnv)) {
		return toUiLocale(fromEnv);
	}

	if (!options.skipOsLocale) {
		try {
			const fromOs = readOsLocale();
			if (fromOs && !isNeutralLocaleTag(fromOs)) {
				return toUiLocale(fromOs);
			}
		} catch {
			// fall through
		}
	}

	const fallback = intlLocale ?? systemIntlLocale();
	if (fallback && !isNeutralLocaleTag(fallback)) {
		return toUiLocale(fallback);
	}

	return 'en';
};
