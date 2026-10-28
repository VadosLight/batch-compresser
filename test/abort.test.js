import test from 'ava';
import {isCancelError} from '../dist/core/compress/abort.js';

test('isCancelError true when signal aborted', t => {
	const c = new AbortController();
	c.abort();
	t.true(isCancelError(new Error('x'), c.signal));
});

test('isCancelError true when error.isCanceled', t => {
	t.true(isCancelError({isCanceled: true, message: 'canceled'}));
});

test('isCancelError false for normal errors', t => {
	t.false(isCancelError(new Error('ffmpeg failed')));
	t.false(isCancelError({isCanceled: false}));
});
