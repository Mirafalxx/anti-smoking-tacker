# Тише — трекер курения

React + TypeScript, Firebase Authentication и Firestore. Мобильный календарь, события курения, статистика, офлайн-кеш и PWA. Собственного сервера нет.

## Архитектура

Используем разделение по функциям приложения. Зависимости направлены от `app` к `features` и далее к `shared`; общие модули не импортируют экраны приложения.

```text
src/
  main.tsx                  # точка входа: React, глобальные стили, PWA
  app/                      # сборка экранов, навигация, шапка приложения
  features/
    auth/                   # Google-вход, профиль и жизненный цикл сессии
    calendar/               # календарь месяца
    entries/                # панель дня, редактор, быстрое добавление
    statistics/             # фильтры, график и сводные показатели
    tracking/               # подписки Firestore, очередь записей и демохранилище
  shared/
    hooks/                  # общие хуки, управление фокусом диалога
    lib/                    # инициализация Firebase и функции работы с датами
    model/                  # типы записей, периодов и подсчёт событий
    styles/                 # глобальное оформление и общие CSS-классы
    ui/                     # уведомления и общие элементы интерфейса
```

`App` соединяет `useSession`, `useTrackerNavigation` и `useTrackerData`, передаёт данные и действия через типизированные props. Визуальные компоненты не выполняют запросы Firestore. `useEntryEditor` хранит локальное состояние формы; временные значения формы не попадают в облако до сохранения. Подписки Firestore очищаются при смене аккаунта, периода и размонтировании.

CSS Modules лежат рядом с компонентами. Общие стили кнопок и подписей подключаются через CSS `composes`. Новые функции добавляйте в соответствующую папку `features`; в `shared` выносите только код, используемый несколькими частями приложения. Дополнительный глобальный store сейчас не требуется.

Unit-тесты лежат рядом с проверяемыми модулями; проверки правил Firestore находятся в `tests/` и требуют эмулятора. Рефакторинг не меняет пути документов, поля данных или ключ демохранилища.

## Локальный запуск

Требуется Node.js 24.12 или новее и npm. В текущей среде установлен Node.js 20: сборка и unit-тесты запускаются, но npm предупреждает о требованиях части Firebase SDK. Для разработки и CI используйте указанную поддерживаемую версию.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

В PowerShell файл можно скопировать через `Copy-Item .env.example .env.local`.
Временные значения `TMP_KEY_NAME` уже предусмотрены в `.env.example` и локальном `.env.local`. При таких значениях Firebase не запускается: доступен деморежим. Он сохраняет записи в localStorage и не использует облако. Локальные демонстрационные записи не импортируются в аккаунт автоматически. Позже замените все четыре заглушки настоящими значениями и перезапустите сервер.

## Подключение Firebase

1. В https://console.firebase.google.com создайте проект и зарегистрируйте Web App. Analytics не требуется.
2. В Authentication → Sign-in method включите Google и выберите email поддержки.
3. В Authentication → Settings → Authorized domains добавьте `localhost` и `<ваш-логин>.github.io` (без пути репозитория).
4. Создайте Firestore Database в production mode, выбрав подходящий регион.
5. Скопируйте содержимое `firestore.rules` в Firestore → Rules и нажмите Publish. Не используйте открытые тестовые правила.
6. Заполните четыре переменные из `.env.example` значениями Web App config и перезапустите dev-сервер.

Конфигурация Web App публична по своей природе. Приватность обеспечивают правила Firestore. Service account и административные ключи приложению не нужны.

Профиль хранит часовой пояс первого входа. События хранят ISO-время и ключ дня. Независимые события имеют уникальные ID; параллельные добавления не перетирают счётчик. При одновременном редактировании одной записи действует последнее изменение Firestore.

## Проверки

```sh
npm test
npm run build
npm run preview
```

Тесты проверяют дневные итоги, перенос и удаление, границы дат и часовые пояса. Тесты правил запускаются переиспользуемым workflow `rules.yml` с Java 21 и Firebase Emulator: основной pipeline вызывает его перед публикацией. Без переменной `FIRESTORE_EMULATOR_HOST` в обычном `npm test` они пропускаются. Локальный запуск с установленной Java 21:

```sh
npx --yes firebase-tools@14 emulators:exec --only firestore --project demo-tishe "npm run test:rules"
```

Перед публичным использованием дополнительно проверьте реальный Google-вход на Android Chrome/iOS Safari, синхронизацию двух устройств и офлайн-перезапуск. Эти проверки требуют настроенного проекта и устройств; они не заменены unit-тестами.

## GitHub Pages

Конфигурация CI/CD подготовлена локально; публикация пока выключена. Основная ветка для публикации — `main`. В `master` можно продолжать разработку: push в неё этот pipeline не запускает.

В `.github/workflows/deploy.yml` настроены три job:

- `build`: Node.js 24, `npm ci`, unit-тесты, проверка Firebase-конфигурации, production-сборка и загрузка `dist` в артефакт Pages.
- `rules`: отдельная проверка правил в Firebase Emulator через `.github/workflows/rules.yml`.
- `deploy`: публикация собранного артефакта после успешного завершения обоих job. Разрешена только для push в `main` и только если `PAGES_DEPLOY_ENABLED=true`.

Pull request в `main` и ручной запуск из Actions выполняют проверки и сборку без публикации. Push в `main` при выключенном флаге также только проверяет и собирает приложение. Ошибка проверки или сборки блокирует публикацию. Схема build → artifact → deploy соответствует [рекомендациям GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Подготовить CI без публикации

1. Откройте [Actions Variables репозитория](https://github.com/Mirafalxx/anti-smoking-tacker/settings/variables/actions).
2. В Repository variables добавьте четыре значения из локального `.env.local`:

   | Имя | Что указать |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | Значение `apiKey` из Firebase Web App config |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `anti-smoking-tracker.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `anti-smoking-tracker` |
   | `VITE_FIREBASE_APP_ID` | Значение `appId` из Firebase Web App config |
   | `PAGES_DEPLOY_ENABLED` | `false` — пока не готовы публиковать |

3. Сохраните конфигурацию в Git и отправьте её в `main`, когда будете готовы запустить только CI. Без четырёх Firebase Variables сборка остановится с перечнем недостающих имён; заглушки `TMP_...` также отклоняются. Локальный `.env.local` GitHub Actions не читает.

Отсутствие `PAGES_DEPLOY_ENABLED` равнозначно выключенной публикации. В текущей задаче push и запуск workflow не выполнялись.

### Включить автопубликацию позже

1. В [Settings → Pages](https://github.com/Mirafalxx/anti-smoking-tacker/settings/pages) выберите Source: **GitHub Actions**.
2. Если environment `github-pages` ограничивает ветки, разрешите ему деплой из `main`.
3. Убедитесь, что домен `mirafalxx.github.io` добавлен в Firebase Authentication → Settings → Authorized domains.
4. Измените Repository variable `PAGES_DEPLOY_ENABLED` на `true`.
5. Следующий push в `main` автоматически запустит проверки, сборку и деплой. Само изменение переменной workflow не запускает.
6. Проверьте адрес `https://mirafalxx.github.io/anti-smoking-tacker/`, Google-вход и обновление страниц `#/` и `#/stats`.

Для репозитория `<логин>.github.io` замените `VITE_BASE_PATH` в workflow на `/`. Для обычного project Pages путь вычисляется из названия репозитория автоматически.

Чтобы сменить ветку автопубликации, измените `on.push.branches`, `on.pull_request.branches` и проверку `github.ref` в job `deploy`, затем согласуйте разрешённые ветки environment `github-pages`.

Правила Firestore проверяются автоматически, но не публикуются через Pages: применяйте их отдельно в Firebase Console после изменений. Для публикации используется встроенный `GITHUB_TOKEN`; отдельный PAT или SSH-ключ в workflow не требуется.

## Офлайн и ограничения

После первого успешного запуска production-сборки service worker кеширует оболочку приложения. Firestore кеширует загруженные диапазоны и отправляет локальные изменения после подключения. Первый вход требует сети. История, которую устройство не загружало, офлайн может быть неполной — интерфейс предупреждает об этом. Для синхронизации откройте приложение с интернетом.

Выход доступен после синхронизации; кеш очищается после выхода. Не очищайте данные браузера, пока есть неотправленные записи. Режим инкогнито и запрет IndexedDB могут ограничивать офлайн-работу.

Шрифт загружается из Google Fonts; офлайн используется системный шрифт. Установка PWA и особенности Google popup требуют проверки на целевых устройствах.
