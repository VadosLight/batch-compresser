import type {DirValidation} from '../fs/validate-dir.js';

export type PickPathResult =
	| {ok: true; path: string}
	| {ok: false; cancelled: boolean; message?: string};

export type FsPort = {
	validateDirectory: (input: string) => Promise<DirValidation>;
	pickFolder: (options?: {prompt?: string}) => Promise<PickPathResult>;
	pickFile: (options?: {prompt?: string}) => Promise<PickPathResult>;
	openContainingFolder: (filePath: string) => Promise<void>;
};
