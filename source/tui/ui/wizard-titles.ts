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
