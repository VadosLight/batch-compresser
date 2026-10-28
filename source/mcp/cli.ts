#!/usr/bin/env node
import process from 'node:process';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {createAppPorts} from '../tui/wire.js';
import {createMcpServer} from './server.js';
import {McpSession} from './session.js';

try {
	const initialPath = process.env['BATCH_COMPRESSER_PATH'];
	const session = new McpSession({
		ports: createAppPorts(),
		initialPath,
	});
	const server = createMcpServer(session);
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error('batch-compresser MCP server on stdio');
} catch (error: unknown) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
