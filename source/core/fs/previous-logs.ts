import {constants} from 'node:fs';
import {access, readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';

/** Statuses that mean the file was already handled and should not be retried. */
export const previousDoneStatuses = new Set([
	'OK',
	'SKIP_LARGER',
	'SKIP_LOW_GAIN',
	'SKIP_USER',
]);

const logLinePattern =
	/^(ok|skip_larger|skip_low_gain|skip_user)\s*\|\s*(?:photo|video)\s*\|\s*(.+?)\s*\|\s*before=/i;

export type LogsPathValidation =
	| {ok: true; resolved: string; kind: 'file' | 'directory'}
	| {ok: false; reason: 'empty' | 'missing' | 'unreadable' | 'notLogsPath'};

export const validateLogsPath = async (
	input: string,
): Promise<LogsPathValidation> => {
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
		if (info.isFile()) {
			return {ok: true, resolved, kind: 'file'};
		}

		if (info.isDirectory()) {
			return {ok: true, resolved, kind: 'directory'};
		}

		return {ok: false, reason: 'notLogsPath'};
	} catch {
		return {ok: false, reason: 'unreadable'};
	}
};

export const parseProcessedPathsFromLogText = (text: string): Set<string> => {
	const paths = new Set<string>();
	for (const line of text.split(/\r?\n/)) {
		const match = logLinePattern.exec(line.trim());
		if (!match?.[2]) {
			continue;
		}

		paths.add(path.resolve(match[2].trim()));
	}

	return paths;
};

export const listLogFiles = async (logsPath: string): Promise<string[]> => {
	const resolved = path.resolve(logsPath.trim());
	const info = await stat(resolved);
	if (info.isFile()) {
		return [resolved];
	}

	if (!info.isDirectory()) {
		return [];
	}

	const entries = await readdir(resolved);
	return entries
		.filter(name => name.endsWith('.log'))
		.map(name => path.join(resolved, name))
		.sort();
};

export const loadProcessedPathsFromLogs = async (
	logsPath: string,
): Promise<{paths: Set<string>; logFiles: string[]}> => {
	const trimmed = logsPath.trim();
	if (!trimmed) {
		return {paths: new Set(), logFiles: []};
	}

	const validation = await validateLogsPath(trimmed);
	if (!validation.ok) {
		throw new Error(`previous_logs_${validation.reason}`);
	}

	const logFiles = await listLogFiles(validation.resolved);
	const paths = new Set<string>();

	for (const file of logFiles) {
		const text = await readFile(file, 'utf8');
		for (const p of parseProcessedPathsFromLogText(text)) {
			paths.add(p);
		}
	}

	return {paths, logFiles};
};
