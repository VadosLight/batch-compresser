import {constants} from 'node:fs';
import {access, stat} from 'node:fs/promises';
import path from 'node:path';

export type DirValidation =
	| {ok: true; resolved: string}
	| {ok: false; reason: 'empty' | 'missing' | 'notDirectory' | 'unreadable'};

export const validateDirectory = async (
	input: string,
): Promise<DirValidation> => {
	const trimmed = input.trim();
	if (!trimmed) {
		return {ok: false, reason: 'empty'};
	}

	const resolved = path.resolve(trimmed);

	try {
		await access(resolved, constants.R_OK);
	} catch {
		return {ok: false, reason: 'missing'};
	}

	try {
		const info = await stat(resolved);
		if (!info.isDirectory()) {
			return {ok: false, reason: 'notDirectory'};
		}
	} catch {
		return {ok: false, reason: 'unreadable'};
	}

	return {ok: true, resolved};
};
