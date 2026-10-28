import {readFile} from 'node:fs/promises';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import type {McpSession} from './session.js';
import {
	awaitSchema,
	openFolderSchema,
	settingsPatchSchema,
	skipVideoSchema,
	statusSchema,
	workersSchema,
} from './schemas.js';
import {errorResult, jsonResult, sessionPayload} from './result.js';

const wrap = async (
	fn: () => unknown,
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> => {
	try {
		return jsonResult(await Promise.resolve(fn()));
	} catch (error) {
		return errorResult(error instanceof Error ? error.message : String(error));
	}
};

export const createMcpServer = (session: McpSession): McpServer => {
	const server = new McpServer({
		name: 'batch-compressor',
		version: '0.0.0',
	});

	server.registerTool(
		'session_status',
		{
			title: 'Session status',
			description:
				'Return the current session view-model (screen, settings, scan, progress, summary).',
			inputSchema: statusSchema,
			annotations: {readOnlyHint: true, idempotentHint: true},
		},
		async ({includeResults}) =>
			wrap(() => sessionPayload(session.getViewModel(), {includeResults})),
	);

	server.registerTool(
		'boot',
		{
			title: 'Boot session',
			description:
				'Check ffmpeg availability. Goes to wizard, or ffmpegWarn if missing. Call once at the start of a session.',
			annotations: {readOnlyHint: false},
		},
		async () => wrap(async () => sessionPayload(await session.boot())),
	);

	server.registerTool(
		'continue_photos_only',
		{
			title: 'Continue photos only',
			description:
				'When ffmpeg is missing (ffmpegWarn / ffmpegInstallFail), continue into the wizard with videos disabled.',
		},
		async () => wrap(() => sessionPayload(session.continuePhotosOnly())),
	);

	server.registerTool(
		'install_ffmpeg',
		{
			title: 'Install ffmpeg',
			description:
				'Attempt confirmed package-manager install of system ffmpeg (brew/apt/…). May prompt for privileges on the host.',
			annotations: {destructiveHint: true},
		},
		async () => wrap(async () => sessionPayload(await session.installFfmpeg())),
	);

	server.registerTool(
		'configure',
		{
			title: 'Configure settings',
			description:
				'Patch compression settings. If rootDir is set, it is validated first. Does not start a scan.',
			inputSchema: settingsPatchSchema,
		},
		async args =>
			wrap(async () => sessionPayload(await session.configure(args))),
	);

	server.registerTool(
		'scan',
		{
			title: 'Scan folder',
			description:
				'Scan rootDir with current settings (applies previous-log skips). On success screen becomes confirm with scan counts.',
		},
		async () => wrap(async () => sessionPayload(await session.scan())),
	);

	server.registerTool(
		'cancel_confirm',
		{
			title: 'Cancel confirm',
			description: 'Leave the confirm screen and return to the wizard.',
		},
		async () => wrap(() => sessionPayload(session.cancelConfirm())),
	);

	server.registerTool(
		'start_compression',
		{
			title: 'Start compression',
			description:
				'Start compression from the confirm screen. Returns immediately; poll session_status or call await_completion.',
			annotations: {destructiveHint: true},
		},
		async () =>
			wrap(() => ({
				...sessionPayload(session.startCompression()),
				compressionRunning: session.isCompressionRunning(),
			})),
	);

	server.registerTool(
		'await_completion',
		{
			title: 'Await completion',
			description:
				'Wait until the background compression finishes (or timeout). Prefer start_compression + session_status for long runs.',
			inputSchema: awaitSchema,
		},
		async ({timeoutMs, includeResults}) =>
			wrap(async () => {
				try {
					const vm = await session.awaitCompletion(timeoutMs);
					return {
						...sessionPayload(vm, {includeResults}),
						compressionRunning: session.isCompressionRunning(),
					};
				} catch (error) {
					if (error instanceof Error && error.message === 'await_timeout') {
						return {
							...sessionPayload(session.getViewModel(), {includeResults}),
							compressionRunning: session.isCompressionRunning(),
							timedOut: true,
						};
					}

					throw error;
				}
			}),
	);

	server.registerTool(
		'skip_video',
		{
			title: 'Skip video',
			description:
				'Abort the in-flight ffmpeg job for path (same as interactive skip). Original file is kept.',
			inputSchema: skipVideoSchema,
		},
		async ({path}) => wrap(() => sessionPayload(session.skipVideo(path))),
	);

	server.registerTool(
		'set_video_workers',
		{
			title: 'Set video workers',
			description:
				'Change video concurrency mid-run (decrease drains without aborting active jobs).',
			inputSchema: workersSchema,
		},
		async ({videoWorkers}) =>
			wrap(() => sessionPayload(session.setVideoWorkers(videoWorkers))),
	);

	server.registerTool(
		'open_folder',
		{
			title: 'Open containing folder',
			description: 'Open the parent folder of a file in the OS file manager.',
			inputSchema: openFolderSchema,
		},
		async ({filePath}) =>
			wrap(async () =>
				sessionPayload(await session.openContainingFolder(filePath)),
			),
	);

	server.registerResource(
		'session',
		'batch-compressor://session',
		{
			title: 'Live session',
			description:
				'Current AppViewModel as JSON (summary without per-file results).',
			mimeType: 'application/json',
		},
		async () => ({
			contents: [
				{
					uri: 'batch-compressor://session',
					mimeType: 'application/json',
					text: JSON.stringify(sessionPayload(session.getViewModel()), null, 2),
				},
			],
		}),
	);

	server.registerResource(
		'summary',
		'batch-compressor://summary',
		{
			title: 'Run summary',
			description:
				'Last run summary when screen is summary; otherwise empty object.',
			mimeType: 'application/json',
		},
		async () => {
			const {summary} = session.getViewModel();
			return {
				contents: [
					{
						uri: 'batch-compressor://summary',
						mimeType: 'application/json',
						text: JSON.stringify(
							summary
								? {
										...summary,
										results: undefined,
										resultCount: summary.results.length,
								  }
								: {},
							null,
							2,
						),
					},
				],
			};
		},
	);

	server.registerResource(
		'log',
		'batch-compressor://log',
		{
			title: 'Session log file',
			description: 'Contents of summary.logPath after a completed run.',
			mimeType: 'text/plain',
		},
		async () => {
			const logPath = session.getViewModel().summary?.logPath;
			if (!logPath) {
				return {
					contents: [
						{
							uri: 'batch-compressor://log',
							mimeType: 'text/plain',
							text: '',
						},
					],
				};
			}

			const text = await readFile(logPath, 'utf8');
			return {
				contents: [
					{
						uri: 'batch-compressor://log',
						mimeType: 'text/plain',
						text,
					},
				],
			};
		},
	);

	server.registerPrompt(
		'compress_folder',
		{
			title: 'Compress a folder',
			description:
				'Guided workflow: boot → configure → scan → start_compression → await/poll.',
			argsSchema: {
				folder: z.string().describe('Absolute path to the folder to compress'),
				photos: z
					.string()
					.optional()
					.describe('yes/no — process photos (default yes)'),
				videos: z
					.string()
					.optional()
					.describe('yes/no — process videos (default yes if ffmpeg ok)'),
			},
		},
		({folder, photos, videos}) => ({
			messages: [
				{
					role: 'user',
					content: {
						type: 'text',
						text: [
							'Compress media with the batch-compressor MCP tools.',
							`Folder: ${folder}`,
							`Photos: ${photos ?? 'yes'}`,
							`Videos: ${videos ?? 'yes'}`,
							'',
							'Steps:',
							'1. boot',
							'2. If screen is ffmpegWarn: continue_photos_only or install_ffmpeg',
							'3. configure with rootDir and processPhotos/processVideos',
							'4. scan — check scan.count on confirm',
							'5. start_compression',
							'6. Poll session_status or await_completion until screen is summary',
							'7. Read batch-compressor://summary or batch-compressor://log',
						].join('\n'),
					},
				},
			],
		}),
	);

	return server;
};
