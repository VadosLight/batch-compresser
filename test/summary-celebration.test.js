import test from 'ava';
import {
	buildCelebration,
	durationTier,
	formatDuration,
} from '../dist/ui/summary-celebration.js';

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

test('durationTier boundaries', t => {
	t.is(durationTier(5 * minute - 1), 'quick');
	t.is(durationTier(5 * minute), 'standard');
	t.is(durationTier(hour - 1), 'standard');
	t.is(durationTier(hour), 'long');
	t.is(durationTier(8 * hour - 1), 'long');
	t.is(durationTier(8 * hour), 'marathon');
	t.is(durationTier(day - 1), 'marathon');
	t.is(durationTier(day), 'epic');
});

test('formatDuration human labels', t => {
	t.is(formatDuration(32_000), '32 с');
	t.is(formatDuration(45 * minute), '45 мин');
	t.true(formatDuration(2 * day + 5 * hour + 12 * minute).includes('2 д'));
	t.true(formatDuration(2 * day + 5 * hour).includes('5 ч'));
});

test('buildCelebration returns title and epic banner', t => {
	const celebration = buildCelebration({
		found: 10,
		compressed: 8,
		skipSmall: 0,
		skipCompressed: 0,
		skipLarger: 0,
		skipLowGain: 0,
		skipPrevious: 0,
		skipUser: 0,
		errors: 0,
		bytesBefore: 500 * 1024 ** 3,
		bytesAfter: 200 * 1024 ** 3,
		logPath: '/tmp/x.log',
		results: [],
		elapsedMs: day + hour,
	});
	t.is(celebration.tier, 'epic');
	t.truthy(celebration.title);
	t.truthy(celebration.banner);
	t.true(celebration.subtitle.length > 0);
});

test('buildCelebration quick has no banner', t => {
	const celebration = buildCelebration({
		found: 1,
		compressed: 1,
		skipSmall: 0,
		skipCompressed: 0,
		skipLarger: 0,
		skipLowGain: 0,
		skipPrevious: 0,
		skipUser: 0,
		errors: 0,
		bytesBefore: 1000,
		bytesAfter: 400,
		logPath: '/tmp/x.log',
		results: [],
		elapsedMs: 20_000,
	});
	t.is(celebration.tier, 'quick');
	t.is(celebration.banner, undefined);
});
