# batch-compresser

Массовое сжатие фото и видео в терминале (Ink TUI). Кроссплатформенно: macOS, Linux, Windows (Node.js).

## Требования

- Node.js ≥ 16
- [ffmpeg](https://ffmpeg.org/) в `PATH` (для видео). Без ffmpeg при старте можно подтвердить установку через brew/apt/dnf/pacman/winget/choco, либо продолжить только с фото.

```bash
# macOS
brew install ffmpeg

# Debian/Ubuntu
sudo apt install ffmpeg

# Windows (winget / Chocolatey)
winget install --id Gyan.FFmpeg -e
choco install ffmpeg
```

## Установка

```bash
npm install
npm run build
npm link   # опционально: команда batch-compresser в PATH
```

## Запуск

```bash
npm start
# или
node dist/cli.js
# или с начальным путём
node dist/cli.js --path ~/Pictures
```

На шаге выбора папки путь проверяется сразу (существует и это каталог). Можно ввести путь вручную или открыть системный диалог (macOS / Windows / Linux с zenity или kdialog).

## Возможности

- Рекурсивный обход папки; галочки «фото» / «видео»
- Отдельные пороги мин. размера (МБ) для фото и видео (`0` = без фильтра)
- Фото (`sharp`): качество JPEG/WebP, пресеты, даунскейл по Мп (12/8/4/2/1), формат «как исходник» / JPEG / WebP
- Видео (системный ffmpeg): H.264 + MP4, CRF + пресеты, макс. высота 1080/720/480
- Режим полной замены или рядом с суффиксом `_compressed`
- Если результат больше исходника — пропуск
- Параллельные воркеры: фото (по умолчанию `CPU−1`) и видео (по умолчанию до `min(4, CPU/2)`), оба настраиваются в мастере
- Опциональный **staging**: копирование с HDD во временную папку на быстром диске → сжатие → запись результата обратно (удобно при тысячах видео)
- **Пропуск уже обработанных**: укажите путь к предыдущему `.log` или папке с логами — файлы со статусами `OK` / `SKIP_LARGER` / `SKIP_LOW_GAIN` / `SKIP_USER` не обрабатываются снова
- Во время сжатия видео: ↑↓ выбрать задачу, `s` + Enter — пропустить (оригинал сохраняется; в логе `SKIP_USER`, учитывается при resume)
- Лог `batch-compresser-YYYYMMDD-HHmmss.log` в целевой папке и финальная сводка на русском

## Разработка

```bash
npm run build
npm test
```

![example](docs/assets/example-1.png)
