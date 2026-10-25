import test from 'ava';
import {
	parseHhMmSs,
	parseProgressTimeSec,
	percentFromTime,
} from '../dist/compress/ffmpeg-progress.js';
import {formatSettingsBlock} from '../dist/log.js';
import {createDefaultSettings} from '../dist/defaults.js';

test('parseHhMmSs', t => {
	t.is(parseHhMmSs('00:01:30.50'), 90.5);
	t.is(parseHhMmSs('01:00:00'), 3600);
	t.is(parseHhMmSs('bad'), undefined);
});

test('parseProgressTimeSec from out_time_ms milliseconds', t => {
	t.is(parseProgressTimeSec('out_time_ms=1500\nprogress=continue\n'), 1.5);
});

test('parseProgressTimeSec from out_time', t => {
	t.is(parseProgressTimeSec('out_time=00:00:05.00\nprogress=continue\n'), 5);
});

test('percentFromTime clamps', t => {
	t.is(percentFromTime(5, 10), 50);
	t.is(percentFromTime(20, 10), 99);
	t.is(percentFromTime(0, 0), 0);
});

test('formatSettingsBlock includes key settings', t => {
	const settings = createDefaultSettings('/tmp/media');
	settings.photoQuality = 75;
	settings.videoCrf = 24;
	settings.replaceFiles = true;
	const block = formatSettingsBlock(settings);
	t.true(block.includes('=== ПАРАМЕТРЫ ==='));
	t.true(block.includes('/tmp/media'));
	t.true(block.includes('Качество фото: 75'));
	t.true(block.includes('CRF видео: 24'));
	t.true(block.includes('замена файлов'));
});
