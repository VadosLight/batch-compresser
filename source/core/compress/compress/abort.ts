export const isCancelError = (
	error: unknown,
	signal?: AbortSignal,
): boolean => {
	if (signal?.aborted) {
		return true;
	}

	if (error && typeof error === 'object' && 'isCanceled' in error) {
		return Boolean((error as {isCanceled?: boolean}).isCanceled);
	}

	return false;
};
