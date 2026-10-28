import {detectInstallPlan, installFfmpeg} from '../../core/ffmpeg-install.js';
import type {ProcessPort} from '../../core/ports/process-port.js';

export const createNodeProcessPort = (): ProcessPort => ({
	detectInstallPlan: async () => detectInstallPlan(),
	installFfmpeg,
});
