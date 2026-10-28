import {en} from './en.js';
import {formatBytesWith} from './format-bytes.js';
import {resolveUiLocale} from './locale.js';
import {ru} from './ru.js';
import type {Messages, UiLocale} from './types.js';

export type {Messages, UiLocale, ByteUnits, DurationUnits} from './types.js';
export {isNeutralLocaleTag, readOsLocale, resolveUiLocale} from './locale.js';
export type {ResolveUiLocaleOptions} from './locale.js';
export {formatBytesWith} from './format-bytes.js';
export {ru} from './ru.js';
export {en} from './en.js';

export const getMessages = (locale: UiLocale): Messages =>
	locale === 'ru' ? ru : en;

/** Active UI locale from the host environment (via os-locale). */
export const locale: UiLocale = resolveUiLocale();

/** Active message catalog (system language). */
export const t: Messages = getMessages(locale);

export const formatBytes = (bytes: number): string =>
	formatBytesWith(bytes, t.byteUnits);
