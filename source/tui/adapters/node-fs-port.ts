import {validateDirectory} from '../../core/fs/validate-dir.js';
import type {FsPort} from '../../core/ports/fs-port.js';
import {openContainingFolder} from './open-path.js';
import {pickFile, pickFolder} from './pick-folder.js';

export const createNodeFsPort = (): FsPort => ({
	validateDirectory,
	pickFolder: async options => pickFolder(options),
	pickFile: async options => pickFile(options),
	openContainingFolder,
});
