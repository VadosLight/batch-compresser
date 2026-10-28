import test from 'ava';
import {detectKind} from '../dist/scan.js';
import {
	ALL_VIDEO_EXTENSIONS,
	CORE_VIDEO_EXTENSIONS,
	resolveVideoExtensions,
} from '../dist/video-extensions.js';

test('core set covers common containers', t => {
	t.true(CORE_VIDEO_EXTENSIONS.has('.mp4'));
	t.true(CORE_VIDEO_EXTENSIONS.has('.mov'));
	t.false(CORE_VIDEO_EXTENSIONS.has('.mpg'));
});

test('all set includes mpeg/ts/3gp and core', t => {
	t.true(ALL_VIDEO_EXTENSIONS.has('.mp4'));
	t.true(ALL_VIDEO_EXTENSIONS.has('.mpg'));
	t.true(ALL_VIDEO_EXTENSIONS.has('.ts'));
	t.true(ALL_VIDEO_EXTENSIONS.has('.3gp'));
	t.true(ALL_VIDEO_EXTENSIONS.has('.mxf'));
});

test('detectKind uses provided video extension set', t => {
	t.is(detectKind('x.mpg'), undefined);
	t.is(detectKind('x.mpg', ALL_VIDEO_EXTENSIONS), 'video');
	t.is(detectKind('x.mp4', CORE_VIDEO_EXTENSIONS), 'video');
	t.is(detectKind('x.jpg', ALL_VIDEO_EXTENSIONS), 'photo');
});

test('resolveVideoExtensions respects scanAllFormats flag', async t => {
	const core = await resolveVideoExtensions(false);
	t.true(core.has('.mp4'));
	t.false(core.has('.mpg'));

	const all = await resolveVideoExtensions(true);
	t.true(all.has('.mp4'));
	t.true(all.has('.mpg'));
	t.true(all.size >= ALL_VIDEO_EXTENSIONS.size);
});
