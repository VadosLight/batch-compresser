import type {ByteUnits} from './types.js';

export const formatBytesWith = (bytes: number, units: ByteUnits): string => {
	if (bytes < 1024) {
		return `${bytes} ${units.b}`;
	}

	const kb = bytes / 1024;
	if (kb < 1024) {
		return `${kb.toFixed(1)} ${units.kb}`;
	}

	const mb = kb / 1024;
	if (mb < 1024) {
		return `${mb.toFixed(2)} ${units.mb}`;
	}

	return `${(mb / 1024).toFixed(2)} ${units.gb}`;
};
