import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import type {AppViewModel} from '../core/app/view-model.js';

export const textResult = (text: string): CallToolResult => ({
	content: [{type: 'text', text}],
});

export const jsonResult = (data: unknown): CallToolResult =>
	textResult(JSON.stringify(data, null, 2));

export const errorResult = (message: string): CallToolResult => ({
	isError: true,
	content: [{type: 'text', text: message}],
});

/** Compact session payload for tools (omit huge result arrays unless asked). */
export const sessionPayload = (
	vm: AppViewModel,
	options: {includeResults?: boolean} = {},
) => {
	const {summary, ...rest} = vm;
	if (!summary) {
		return rest;
	}

	const {results, ...summaryRest} = summary;
	return {
		...rest,
		summary: options.includeResults
			? summary
			: {...summaryRest, resultCount: results.length},
	};
};
