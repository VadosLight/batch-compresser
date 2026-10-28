import type {
	FfmpegInstallPlan,
	InstallFfmpegResult,
} from '../ffmpeg-install.js';

export type ProcessPort = {
	detectInstallPlan: () => Promise<FfmpegInstallPlan | undefined>;
	installFfmpeg: (plan: FfmpegInstallPlan) => Promise<InstallFfmpegResult>;
};
