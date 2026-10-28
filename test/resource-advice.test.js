import test from 'ava';
import {sampleResourceAdvice} from '../dist/compress/resource-advice.js';

test('decrease when free memory is low', t => {
	const result = sampleResourceAdvice({
		videoWorkers: 2,
		maxWorkers: 8,
		pendingCount: 5,
		load1: 0.1,
		cpuCount: 8,
		freeMemRatio: 0.05,
	});
	t.is(result.advice, 'decrease');
});

test('decrease when load is high', t => {
	const result = sampleResourceAdvice({
		videoWorkers: 3,
		maxWorkers: 8,
		pendingCount: 10,
		load1: 7.5,
		cpuCount: 8,
		freeMemRatio: 0.5,
	});
	t.is(result.advice, 'decrease');
});

test('increase when load is low and pending work exists', t => {
	const result = sampleResourceAdvice({
		videoWorkers: 1,
		maxWorkers: 8,
		pendingCount: 4,
		load1: 1,
		cpuCount: 8,
		freeMemRatio: 0.5,
	});
	t.is(result.advice, 'increase');
});

test('ok when load is moderate', t => {
	const result = sampleResourceAdvice({
		videoWorkers: 2,
		maxWorkers: 8,
		pendingCount: 3,
		load1: 5,
		cpuCount: 8,
		freeMemRatio: 0.4,
	});
	t.is(result.advice, 'ok');
});

test('ok when loadavg is zero (windows) unless memory low', t => {
	const result = sampleResourceAdvice({
		videoWorkers: 1,
		maxWorkers: 8,
		pendingCount: 10,
		load1: 0,
		cpuCount: 8,
		freeMemRatio: 0.5,
		loadAvailable: false,
	});
	t.is(result.advice, 'ok');
});

test('no increase without pending work', t => {
	const result = sampleResourceAdvice({
		videoWorkers: 1,
		maxWorkers: 8,
		pendingCount: 0,
		load1: 0.5,
		cpuCount: 8,
		freeMemRatio: 0.5,
	});
	t.is(result.advice, 'ok');
});

test('no decrease when already at one worker', t => {
	const result = sampleResourceAdvice({
		videoWorkers: 1,
		maxWorkers: 8,
		pendingCount: 5,
		load1: 9,
		cpuCount: 8,
		freeMemRatio: 0.05,
	});
	t.is(result.advice, 'ok');
});
