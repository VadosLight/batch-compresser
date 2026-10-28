import {z} from 'zod';

export const settingsPatchSchema = z
	.object({
		rootDir: z.string().describe('Absolute or resolvable folder to compress'),
		processPhotos: z.boolean(),
		processVideos: z.boolean(),
		minPhotoMb: z.number().min(0),
		minVideoMb: z.number().min(0),
		photoFormat: z.enum(['same', 'jpeg', 'webp']),
		megapixels: z.union([
			z.literal(0),
			z.literal(1),
			z.literal(2),
			z.literal(4),
			z.literal(8),
			z.literal(12),
		]),
		photoQuality: z.number().int().min(1).max(100),
		photoPreset: z.enum(['high', 'medium', 'low', 'custom']),
		videoCrf: z.number().int().min(0).max(51),
		videoPreset: z.enum(['high', 'medium', 'low', 'custom']),
		videoMaxHeight: z.union([
			z.literal(0),
			z.literal(480),
			z.literal(720),
			z.literal(1080),
		]),
		videosSmallFirst: z.boolean(),
		videoScanAllFormats: z.boolean(),
		replaceFiles: z.boolean(),
		photoWorkers: z.number().int().min(1),
		videoWorkers: z.number().int().min(1),
		stageToFastDisk: z.boolean(),
		stageDir: z.string(),
		previousLogsPath: z
			.string()
			.describe('Previous .log file or folder of logs for resume; empty = off'),
	})
	.partial();

export const awaitSchema = z.object({
	timeoutMs: z
		.number()
		.int()
		.positive()
		.optional()
		.describe('Max wait in ms; omit to wait until the run finishes'),
	includeResults: z
		.boolean()
		.optional()
		.describe('Include per-file summary.results (can be large)'),
});

export const skipVideoSchema = z.object({
	path: z.string().describe('Absolute path of the active video to skip'),
});

export const workersSchema = z.object({
	videoWorkers: z.number().int().min(1).describe('Target video concurrency'),
});

export const openFolderSchema = z.object({
	filePath: z.string().describe('File whose parent folder should open'),
});

export const statusSchema = z.object({
	includeResults: z.boolean().optional(),
});
