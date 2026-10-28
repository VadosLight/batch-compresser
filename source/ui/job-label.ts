import path from 'node:path';

/** `parent/file` for nested paths; basename only at filesystem root. */
export const formatJobLabel = (filePath: string): string => {
	const base = path.basename(filePath);
	const parent = path.basename(path.dirname(filePath));
	if (!parent || parent === '.' || parent === path.sep || parent === '/') {
		return base;
	}

	// Windows drive root: dirname is `C:\` → basename may be `C:` or empty-ish
	if (/^[A-Za-z]:$/.test(parent)) {
		return base;
	}

	return `${parent}/${base}`;
};
