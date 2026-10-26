export const ru = {
	appTitle: 'Batch Compresser — массовое сжатие фото и видео',
	ffmpegOk: 'ffmpeg найден',
	ffmpegMissing:
		'ffmpeg не найден в PATH. Видео будет недоступно. Установите ffmpeg (brew/apt/choco) и перезапустите.',
	ffmpegOnlyPhotos: 'Продолжить только с фото',
	pathPrompt: 'Путь к папке',
	pathNotSet: '(не выбран)',
	pathTypeManually: 'Ввести путь вручную',
	pathOpenExplorer: 'Открыть проводник…',
	folderPickerOpen: 'Откройте окно выбора папки…',
	folderPickerFailed: 'Не удалось открыть выбор папки',
	pathError: {
		empty: 'Укажите путь к папке',
		missing: 'Папка не существует или недоступна',
		notDirectory: 'Указанный путь не является папкой',
		unreadable: 'Нет доступа к папке',
	},
	processPhotos: 'Обрабатывать фото',
	processVideos: 'Обрабатывать видео',
	minPhotoMb: 'Мин. размер фото (МБ, 0 = выкл)',
	minVideoMb: 'Мин. размер видео (МБ, 0 = выкл)',
	photoFormat: 'Формат фото',
	formatSame: 'Как у исходника',
	formatJpeg: 'JPEG',
	formatWebp: 'WebP',
	megapixels: 'Макс. разрешение (Мп)',
	qualityPreset: 'Пресет качества',
	photoQuality: 'Качество фото (1–100)',
	videoCrf: 'CRF видео (меньше = лучше)',
	videoHeight: 'Макс. высота видео',
	replaceFiles: 'Полная замена файлов (иначе рядом *_compressed)',
	photoWorkers: 'Параллельных воркеров для фото',
	videoWorkers: 'Параллельных воркеров для видео',
	workersHint:
		'Для тысяч видео увеличьте воркеры (учитывайте CPU/диск; на HDD лучше 1–2)',
	stageToFastDisk: 'Staging на быстрый диск (HDD→tmp→обработка→назад)',
	stageDir: 'Папка staging (лучше на SSD)',
	stageDirHint: 'Например /tmp или путь на SSD',
	stageHint:
		'При файлах на HDD + SSD: включите staging и поднимите воркеры видео',
	previousLogsPath: 'Предыдущие логи (пропуск обработанных)',
	previousLogsHint: 'Файл .log или папка с логами; пустой путь — без пропуска',
	previousLogsOpenFolder: 'Выбрать папку с логами…',
	previousLogsOpenFile: 'Выбрать файл лога…',
	previousLogsClear: 'Очистить путь',
	previousLogsPickFolderPrompt: 'Выберите папку с предыдущими логами',
	previousLogsPickFilePrompt: 'Выберите файл предыдущего лога',
	previousLogsError: {
		empty: 'Укажите путь к логам',
		missing: 'Путь к предыдущим логам не существует',
		unreadable: 'Нет доступа к предыдущим логам',
		notLogsPath: 'Путь к логам должен быть файлом или папкой',
	},
	videoStatusStage: 'Копирование на быстрый диск',
	next: 'Далее',
	back: 'Назад (Esc)',
	confirmTitle: 'Подтверждение запуска',
	confirmStart: 'Enter — начать',
	confirmCancel: 'Esc — назад к настройкам',
	scanning: 'Сканирование…',
	foundFiles: (n: number) => `Найдено файлов к обработке: ${n}`,
	noFiles: 'Нет файлов по заданным фильтрам.',
	progress: (done: number, total: number, current: string) =>
		`Обработано ${done}/${total}: ${current}`,
	batchProgress: (done: number, total: number) => `Готово ${done}/${total}`,
	batchSaved: (before: number, after: number, saved: number, pct: number) =>
		`экономия ${formatBytes(saved)} (${formatBytes(before)} → ${formatBytes(
			after,
		)}, −${pct.toFixed(1)}%)`,
	activeJobs: 'Активных задач',
	fileStatus: 'Статус',
	processing: 'Обработка…',
	kindPhoto: 'фото',
	kindVideo: 'видео',
	photoStatusCompress: 'Сжатие фото',
	videoStatusProbe: 'Анализ видео (ffprobe)',
	videoStatusEncode: 'Кодирование H.264',
	videoStatusFinalize: 'Запись результата',
	videoStatusDone: 'Готово',
	summaryTitle: 'Сводка',
	logPath: (p: string) => `Лог: ${p}`,
	compressed: (n: number) => `Сжато: ${n}`,
	skipSmall: (n: number) => `Пропущено (маленькие): ${n}`,
	skipCompressed: (n: number) => `Пропущено (*_compressed): ${n}`,
	skipPrevious: (n: number) => `Пропущено (уже в логах): ${n}`,
	skipLarger: (n: number) => `Пропущено (результат больше): ${n}`,
	skipLowGain: (n: number) => `Пропущено (экономия < 3%): ${n}`,
	errors: (n: number) => `Ошибки: ${n}`,
	bytes: (before: number, after: number, pct: number) =>
		`Размер: ${formatBytes(before)} → ${formatBytes(
			after,
		)} (экономия ${pct.toFixed(1)}%)`,
	done: 'Готово. Нажмите Ctrl+C для выхода.',
	yes: 'Да',
	no: 'Нет',
	on: 'вкл',
	off: 'выкл',
	step: (n: number, total: number, title: string) =>
		`Шаг ${n}/${total}: ${title}`,
	needMediaType: 'Включите хотя бы фото или видео',
} as const;

export const formatBytes = (bytes: number): string => {
	if (bytes < 1024) {
		return `${bytes} Б`;
	}

	const kb = bytes / 1024;
	if (kb < 1024) {
		return `${kb.toFixed(1)} КБ`;
	}

	const mb = kb / 1024;
	if (mb < 1024) {
		return `${mb.toFixed(2)} МБ`;
	}

	return `${(mb / 1024).toFixed(2)} ГБ`;
};
