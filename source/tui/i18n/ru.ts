import {formatBytesWith} from './format-bytes.js';
import type {Messages} from './types.js';

const byteUnits = {
	b: 'Б',
	kb: 'КБ',
	mb: 'МБ',
	gb: 'ГБ',
} as const;

const fb = (n: number): string => formatBytesWith(n, byteUnits);

export const ru: Messages = {
	appTitle: 'Batch Compresser — массовое сжатие фото и видео',
	ffmpegOk: 'ffmpeg найден',
	ffmpegMissing: 'ffmpeg не найден в PATH.',
	ffmpegOnlyPhotos: 'Продолжить только с фото',
	ffmpegInstallPrompt: (manager: string) => `Установить через ${manager}?`,
	ffmpegInstallEnter: 'Enter — установить',
	ffmpegInstallEsc: 'Esc — только фото',
	ffmpegInstallManual:
		'Установите вручную: brew / apt / winget / choco install ffmpeg',
	ffmpegInstalling: 'Установка ffmpeg…',
	ffmpegInstallFailed: 'Не удалось установить ffmpeg.',
	ffmpegInstallRetry: 'Enter — повторить · Esc — только фото',
	ffmpegInstallOk: 'ffmpeg установлен',
	checkingFfmpeg: 'Проверка ffmpeg…',
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
	videosSmallFirst: 'Сначала маленькие видео',
	videosSmallFirstHint:
		'Очередь по возрастанию размера — быстрее виден прогресс',
	videoScanAllFormats: 'Сканировать все форматы ffmpeg',
	videoScanAllFormatsHint:
		'Расширения из demuxers ffmpeg + полный список контейнеров; иначе только распространённые',
	videoScanAllFormatsOn: 'Все форматы ffmpeg',
	videoScanAllFormatsOff: 'Только основные (mp4/mov/mkv/…)',
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
	nextArrow: '→ Далее',
	backArrow: '← Назад',
	confirmTitle: 'Подтверждение запуска',
	confirmStart: 'Enter — начать',
	confirmCancel: 'Esc — назад к настройкам',
	confirmFolder: (path: string) => `Папка: ${path}`,
	confirmMode: (replace: boolean) =>
		`Режим: ${replace ? 'замена файлов' : 'рядом *_compressed'}`,
	confirmPhoto: ({minMb, mpLabel, quality}) =>
		`Фото: мин ${minMb} МБ, ${mpLabel} Мп, q=${quality}`,
	confirmVideo: ({minMb, crf, heightLabel, smallFirstSuffix, scanFormats}) =>
		`Видео: мин ${minMb} МБ, CRF=${crf}, высота=${heightLabel}${smallFirstSuffix}, ${scanFormats}`,
	confirmWorkers: (parts: string) => `Воркеры: ${parts}`,
	confirmStaging: (enabled: boolean, dir: string) =>
		`Staging: ${enabled ? 'Да' : 'Нет'}${enabled ? ` → ${dir}` : ''}`,
	workerPhoto: (n: number) => `фото ${n}`,
	workerVideo: (n: number) => `видео ${n}`,
	mpUnlimited: '∞',
	mpUnchanged: 'без изм.',
	heightSource: 'исходное',
	heightSourceShort: 'исх.',
	scanning: 'Сканирование…',
	foundFiles: (n: number) => `Найдено файлов к обработке: ${n}`,
	noFiles: 'Нет файлов по заданным фильтрам.',
	progress: (done: number, total: number, current: string) =>
		`Обработано ${done}/${total}: ${current}`,
	batchProgress: (done: number, total: number) => `Готово ${done}/${total}`,
	batchSaved: (before: number, after: number, saved: number, pct: number) =>
		`экономия ${fb(saved)} (${fb(before)} → ${fb(after)}, −${pct.toFixed(1)}%)`,
	activeJobs: 'Активных задач',
	skipHint: '↑↓ выбор · s пропуск · [ ] воркеры · o папка',
	openFolderFailed: 'Не удалось открыть папку',
	skipConfirm: (name: string) => `Пропустить ${name}? Enter — да · Esc — нет`,
	videoWorkersLive: (n: number) => `Воркеры видео: ${n}`,
	resourceLoad: (loadPerCore: number, cpuCount: number) =>
		`нагрузка ${loadPerCore.toFixed(2)}× (${cpuCount})`,
	workerAdviceIncrease: 'совет: увеличить',
	workerAdviceDecrease: 'совет: уменьшить',
	workerAdviceOk: 'совет: оптимально',
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
	celebrationTitle: {
		quick: 'Быстро и чисто',
		standard: 'Готово!',
		long: 'Долгая сессия позади',
		marathon: 'Почти сутки за станком — заслуженный отдых',
		epic: 'Выдержали марафон!',
	},
	celebrationSubtitle: (
		_tier: string,
		compressed: number,
		elapsedLabel: string,
		savedLabel: string,
	) => `${compressed} сжато за ${elapsedLabel} · освобождено ${savedLabel}`,
	summaryStats: (parts: {
		elapsedLabel: string;
		compressed: number;
		before: string;
		after: string;
		pct: number;
	}) =>
		`${parts.elapsedLabel} · сжато ${parts.compressed} · ${parts.before} → ${
			parts.after
		} (−${parts.pct.toFixed(1)}%)`,
	logPath: (p: string) => `Лог: ${p}`,
	compressed: (n: number) => `Сжато: ${n}`,
	skipSmall: (n: number) => `Пропущено (маленькие): ${n}`,
	skipCompressed: (n: number) => `Пропущено (*_compressed): ${n}`,
	skipPrevious: (n: number) => `Пропущено (уже в логах): ${n}`,
	skipUser: (n: number) => `Пропущено (пользователь): ${n}`,
	skipLarger: (n: number) => `Пропущено (результат больше): ${n}`,
	skipLowGain: (n: number) => `Пропущено (экономия < 3%): ${n}`,
	errors: (n: number) => `Ошибки: ${n}`,
	bytes: (before: number, after: number, pct: number) =>
		`Размер: ${fb(before)} → ${fb(after)} (экономия ${pct.toFixed(1)}%)`,
	done: 'Готово. Нажмите Ctrl+C для выхода.',
	yes: 'Да',
	no: 'Нет',
	on: 'вкл',
	off: 'выкл',
	step: (n: number, total: number, title: string) =>
		`Шаг ${n}/${total}: ${title}`,
	needMediaType: 'Включите хотя бы фото или видео',
	wizardStepTitle: {
		1: 'Папка',
		2: 'Типы файлов',
		3: 'Пороги размера',
		4: 'Настройки фото',
		5: 'Настройки видео',
		6: 'Вывод, воркеры и логи',
		7: 'Готово к сканированию',
	},
	mediaSummary: (photo: string, video: string) =>
		`Фото: ${photo} · Видео: ${video}`,
	togglePhotoOn: 'Включить фото',
	togglePhotoOff: 'Выключить фото',
	toggleVideoOn: 'Включить видео',
	toggleVideoOff: 'Выключить видео',
	toggleVideoNoFfmpeg: 'Включить видео (нет ffmpeg)',
	thresholdPhoto: (mb: number) => `Фото ≥ ${mb} МБ`,
	thresholdVideo: (mb: number) => `Видео ≥ ${mb} МБ`,
	changeMinPhoto: 'Изменить мин. фото',
	changeMinVideo: 'Изменить мин. видео',
	photoSummary: (format: string, mpLabel: string, quality: number) =>
		`Формат: ${format}, Мп: ${mpLabel}, качество: ${quality}`,
	menuFormat: 'Формат',
	menuMp: 'Мегапиксели',
	menuQualityPreset: 'Пресет качества',
	menuQualityNumber: 'Число качества',
	customPreset: 'Свой',
	qualityHigh: 'Высокое',
	qualityMedium: 'Среднее',
	qualityLow: 'Низкое',
	megapixelsUnchanged: 'Без изменения',
	megapixelsN: (n: number) => `${n} Мп`,
	heightNp: (n: number) => `${n}p`,
	videoSummary: (crf: number, heightLabel: string) =>
		`CRF: ${crf}, высота: ${heightLabel}`,
	menuPreset: 'Пресет',
	menuCrf: 'CRF числом',
	menuHeight: 'Макс. высота',
	toggleSmallFirstOn: 'Включить «сначала маленькие»',
	toggleSmallFirstOff: 'Выключить «сначала маленькие»',
	toggleScanAllOn: (label: string) => `Включить «${label}»`,
	toggleScanAllOff: (label: string) => `Выключить «${label}»`,
	readyHint: 'Проверьте настройки и запустите сканирование.',
	goScan: 'Сканировать и подтвердить',
	enterValidateNext: 'Enter — проверить и далее · Esc — меню',
	enterSaveBack: 'Enter — сохранить · Esc — назад',
	outputToggleToSibling: 'Переключить на «рядом *_compressed»',
	outputToggleToReplace: 'Переключить на полную замену',
	outputPhotoWorkers: 'Воркеры фото',
	outputVideoWorkers: 'Воркеры видео',
	outputStagingOff: 'Выключить staging на быстрый диск',
	outputStagingOn: 'Включить staging (HDD→SSD tmp)',
	outputStageDir: 'Путь staging-папки',
	outputPreviousLogs: 'Путь к предыдущим логам',
	pickFolderDefault: 'Выберите папку для сжатия',
	pickFileDefault: 'Выберите файл лога',
	needZenityFolder: 'Установите zenity или kdialog для выбора папки',
	needZenityFile: 'Установите zenity или kdialog для выбора файла',
	zenityLogFilter: 'Логи (*.log) | *.log',
	zenityAllFilter: 'Все файлы | *',
	cliHelp: `
	Использование
	  $ batch-compresser

	Опции
	  --path, -p  Начальный путь к папке

	Примеры
	  $ batch-compresser
	  $ batch-compresser --path ~/Pictures
`,
	byteUnits,
	durationUnits: {
		d: 'д',
		h: 'ч',
		min: 'мин',
		s: 'с',
	},
};
