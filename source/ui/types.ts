import type {CompressSettings} from '../types.js';

export type Screen =
	| 'boot'
	| 'ffmpegWarn'
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

export const totalWizardSteps = 7;

export const wizardStepTitle = (step: number): string => {
	const titles = [
		'',
		'Папка',
		'Типы файлов',
		'Пороги размера',
		'Настройки фото',
		'Настройки видео',
		'Вывод и параллельность',
		'Готово к сканированию',
	];
	return titles[step] ?? '';
};
