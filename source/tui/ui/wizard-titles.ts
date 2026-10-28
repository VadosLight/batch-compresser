import {t} from '../i18n/index.js';

export const wizardStepTitle = (step: number): string => {
	if (step >= 1 && step <= 7) {
		return t.wizardStepTitle[step as 1 | 2 | 3 | 4 | 5 | 6 | 7];
	}

	return '';
};
