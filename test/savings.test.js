import test from 'ava';
import {
	rejectReasonForSizes,
	savingsRatio,
	videoMinSavingsRatio,
} from '../dist/compress/write.js';

test('savingsRatio', t => {
	t.is(savingsRatio(1000, 700), 0.3);
	t.is(savingsRatio(1000, 1000), 0);
	t.is(savingsRatio(0, 0), 0);
});

test('rejectReasonForSizes larger', t => {
	t.is(rejectReasonForSizes(1000, 1000), 'skip_larger');
	t.is(rejectReasonForSizes(1000, 1100), 'skip_larger');
});

test('rejectReasonForSizes low gain under 3%', t => {
	t.is(videoMinSavingsRatio, 0.03);
	// 2% savings
	t.is(
		rejectReasonForSizes(10_000, 9800, videoMinSavingsRatio),
		'skip_low_gain',
	);
	// exactly 3%
	t.is(rejectReasonForSizes(10_000, 9700, videoMinSavingsRatio), undefined);
	// 10% savings
	t.is(rejectReasonForSizes(10_000, 9000, videoMinSavingsRatio), undefined);
});

test('photos without minSavings still only reject larger', t => {
	t.is(rejectReasonForSizes(10_000, 9800, 0), undefined);
});
