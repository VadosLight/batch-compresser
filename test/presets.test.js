import test from 'ava';
import {
	compressedSiblingPath,
	defaultPhotoWorkers,
	getPreset,
	isBelowMinSize,
	isCompressedName,
	mbToBytes,
	scaledSize,
	targetPixelsForMp,
} from '../dist/core/presets.js';
import {detectKind} from '../dist/core/scan.js';
import {buildSummary, makeLogFileName} from '../dist/core/log.js';

test('scaledSize downscales preserving aspect', t => {
	const next = scaledSize(4000, 3000, 8_000_000);
	t.truthy(next);
	t.true(next.width * next.height <= 8_000_000 + 10_000);
	t.is(
		Math.round((next.width / next.height) * 100),
		Math.round((4000 / 3000) * 100),
	);
});

test('scaledSize skips when already small', t => {
	t.is(scaledSize(800, 600, 8_000_000), undefined);
});

test('targetPixelsForMp', t => {
	t.is(targetPixelsForMp(0), undefined);
	t.is(targetPixelsForMp(4), 4_000_000);
});

test('min size filter', t => {
	t.false(isBelowMinSize(mbToBytes(1), 0));
	t.true(isBelowMinSize(1000, 0.5));
	t.false(isBelowMinSize(mbToBytes(1), 0.5));
});

test('compressed sibling naming', t => {
	t.is(compressedSiblingPath('/a/b/photo.jpg'), '/a/b/photo_compressed.jpg');
	t.is(
		compressedSiblingPath('/a/b/clip.mov', '.mp4'),
		'/a/b/clip_compressed.mp4',
	);
	t.true(isCompressedName('/a/photo_compressed.jpg'));
	t.false(isCompressedName('/a/photo.jpg'));
});

test('presets map quality and crf', t => {
	t.is(getPreset('medium')?.photoQuality, 80);
	t.is(getPreset('medium')?.videoCrf, 23);
	t.is(getPreset('high')?.photoQuality, 90);
});

test('default photo workers at least 1', t => {
	t.true(defaultPhotoWorkers() >= 1);
});

test('detectKind', t => {
	t.is(detectKind('x.JPG'), 'photo');
	t.is(detectKind('x.heic'), 'photo');
	t.is(detectKind('x.mp4'), 'video');
	t.is(detectKind('x.txt'), undefined);
});

test('makeLogFileName shape', t => {
	const name = makeLogFileName(new Date('2026-10-25T12:34:56'));
	t.regex(name, /^batch-compresser-\d{8}-\d{6}-\d{3}\.log$/);
});

test('buildSummary counts', t => {
	const results = [
		{
			path: 'a',
			kind: 'photo',
			status: 'ok',
			bytesBefore: 1000,
			bytesAfter: 400,
		},
		{
			path: 'b',
			kind: 'photo',
			status: 'skip_larger',
			bytesBefore: 500,
			bytesAfter: 500,
		},
		{
			path: 'c',
			kind: 'video',
			status: 'error',
			bytesBefore: 200,
			bytesAfter: 200,
			errorMessage: 'x',
		},
		{
			path: 'd',
			kind: 'video',
			status: 'skip_low_gain',
			bytesBefore: 300,
			bytesAfter: 300,
		},
		{
			path: 'e',
			kind: 'video',
			status: 'skip_user',
			bytesBefore: 400,
			bytesAfter: 400,
		},
	];
	const summary = buildSummary(
		results,
		{skipSmall: 2, skipCompressed: 1, skipPrevious: 4},
		'/tmp/log',
	);
	t.is(summary.compressed, 1);
	t.is(summary.skipLarger, 1);
	t.is(summary.skipLowGain, 1);
	t.is(summary.skipUser, 1);
	t.is(summary.errors, 1);
	t.is(summary.skipSmall, 2);
	t.is(summary.skipCompressed, 1);
	t.is(summary.skipPrevious, 4);
	t.is(summary.bytesBefore, 2400);
	t.is(summary.bytesAfter, 1800);
	t.is(summary.elapsedMs, 0);
	t.is(summary.durationTier, 'quick');
});

test('buildSummary stores elapsedMs', t => {
	const summary = buildSummary(
		[],
		{skipSmall: 0, skipCompressed: 0, skipPrevious: 0},
		'/tmp/log',
		12_345,
	);
	t.is(summary.elapsedMs, 12_345);
	t.is(summary.durationTier, 'quick');
});
