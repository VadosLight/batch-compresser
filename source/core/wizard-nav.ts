import type {CompressSettings} from '../types.js';

export type Screen =
	| 'boot'
	| 'ffmpegWarn'
	| 'ffmpegInstalling'
	| 'ffmpegInstallFail'
	| 'wizard'
	| 'scanning'
	| 'confirm'
	| 'running'
	| 'summary';

export type PatchSettings = (partial: Partial<CompressSettings>) => void;

export type WizardNavProps = {
	settings: CompressSettings;
	patch: PatchSettings;
	onNext: () => void;
};

export type WizardNavContext = {
	processPhotos: boolean;
	processVideos: boolean;
	ffmpegAvailable: boolean;
};

/** Physical wizard step ids (1–7). Some are skipped when media type is off. */
export const totalWizardSteps = 7;

const stepTitles: Record<number, string> = {
	1: 'Папка',
	2: 'Типы файлов',
	3: 'Пороги размера',
	4: 'Настройки фото',
	5: 'Настройки видео',
	6: 'Вывод, воркеры и логи',
	7: 'Готово к сканированию',
};

export const wizardStepTitle = (step: number): string => stepTitles[step] ?? '';

export const isWizardStepEnabled = (
	step: number,
	ctx: WizardNavContext,
): boolean => {
	if (step < 1 || step > totalWizardSteps) {
		return false;
	}

	if (step === 4) {
		return ctx.processPhotos;
	}

	if (step === 5) {
		return ctx.processVideos && ctx.ffmpegAvailable;
	}

	return true;
};

export const visibleWizardSteps = (ctx: WizardNavContext): number[] => {
	const steps: number[] = [];
	for (let step = 1; step <= totalWizardSteps; step++) {
		if (isWizardStepEnabled(step, ctx)) {
			steps.push(step);
		}
	}

	return steps;
};

export const nextWizardStep = (
	current: number,
	ctx: WizardNavContext,
): number => {
	for (let step = current + 1; step <= totalWizardSteps; step++) {
		if (isWizardStepEnabled(step, ctx)) {
			return step;
		}
	}

	return current;
};

export const prevWizardStep = (
	current: number,
	ctx: WizardNavContext,
): number => {
	for (let step = current - 1; step >= 1; step--) {
		if (isWizardStepEnabled(step, ctx)) {
			return step;
		}
	}

	return current;
};

export const wizardStepOrdinal = (
	step: number,
	ctx: WizardNavContext,
): {index: number; total: number} => {
	const visible = visibleWizardSteps(ctx);
	const index = visible.indexOf(step);
	return {
		index: index >= 0 ? index + 1 : Math.max(1, visible.length),
		total: visible.length,
	};
};
