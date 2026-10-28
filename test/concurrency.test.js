import test from 'ava';
import {createConcurrencyLimiter} from '../dist/compress/concurrency.js';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('createConcurrencyLimiter runs up to concurrency', async t => {
	const limit = createConcurrencyLimiter(2);
	let running = 0;
	let maxRunning = 0;

	const job = async () => {
		running++;
		maxRunning = Math.max(maxRunning, running);
		await delay(30);
		running--;
	};

	await Promise.all([
		limit.run(job),
		limit.run(job),
		limit.run(job),
		limit.run(job),
	]);
	t.is(maxRunning, 2);
	t.is(limit.activeCount, 0);
	t.is(limit.pendingCount, 0);
});

test('setConcurrency increase starts pending jobs', async t => {
	const limit = createConcurrencyLimiter(1);
	let started = 0;

	const job = async () => {
		started++;
		await delay(80);
	};

	const p1 = limit.run(job);
	const p2 = limit.run(job);
	await delay(10);
	t.is(started, 1);
	t.is(limit.pendingCount, 1);

	limit.setConcurrency(2);
	await delay(10);
	t.is(started, 2);

	await Promise.all([p1, p2]);
});

test('setConcurrency decrease drains without aborting active', async t => {
	const limit = createConcurrencyLimiter(2);
	let finished = 0;

	const job = async () => {
		await delay(50);
		finished++;
	};

	const promises = [limit.run(job), limit.run(job), limit.run(job)];
	await delay(10);
	t.is(limit.activeCount, 2);

	limit.setConcurrency(1);
	await Promise.all(promises);
	t.is(finished, 3);
	t.is(limit.getConcurrency(), 1);
});

test('setConcurrency clamps to at least 1', t => {
	const limit = createConcurrencyLimiter(3);
	limit.setConcurrency(0);
	t.is(limit.getConcurrency(), 1);
	limit.setConcurrency(-5);
	t.is(limit.getConcurrency(), 1);
});

test('setConcurrency clamps to max when provided', t => {
	const limit = createConcurrencyLimiter(1, {max: 4});
	limit.setConcurrency(99);
	t.is(limit.getConcurrency(), 4);
});
