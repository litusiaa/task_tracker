# Согласование квот

Веб-приложение для согласования квот с интеграцией Todoist API.

## Технологии

### Frontend
- React 18
- Vite
- TypeScript
- TailwindCSS
- React Hook Form
- Zod (валидация)
- Axios (HTTP клиент)

### Backend
- Node.js
- Express
- TypeScript
- Zod (валидация)
- Todoist REST API v2

## Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd quota-approval-app
```

2. Установите зависимости:
```bash
npm run install:all
```

3. Настройте переменные окружения:
```bash
# Скопируйте пример файла
cp backend/env.example backend/.env

# Отредактируйте .env файл
nano backend/.env
```

### Переменные окружения

Создайте файл `backend/.env` со следующими переменными:

```env
TODOIST_TOKEN=your_todoist_token_here
TODOIST_PROJECT_ID=your_project_id_here
TIMEZONE=Europe/Moscow
PORT=5000
```

#### Получение Todoist токена:
1. Зайдите в [Todoist Settings](https://app.todoist.com/app/settings)
2. Перейдите в раздел "Integrations" → "Developer"
3. Создайте новый токен

#### Получение Project ID:
1. Откройте проект в Todoist
2. ID проекта можно найти в URL: `https://app.todoist.com/app/project/PROJECT_ID`

## Запуск

### Разработка
```bash
# Запуск frontend и backend одновременно
npm run dev

# Или по отдельности:
npm run dev:frontend  # Frontend на http://localhost:3000
npm run dev:backend   # Backend на http://localhost:5000
```

### Продакшн
```bash
# Сборка
npm run build

# Запуск
npm start
```

## Функциональность

### Общие поля (обязательные)
- Название компании
- Кто запрашивает квоту (выбор из списка)
- Тип согласования (Квота для КП / Договор / NDA)

### Разделы

#### NDA
- Реквизиты компании (текст или файл)
- Приоритет (Срочные ≤ 4ч / Средние ≤ 1 день)
- Ответственный: Инна

#### Договор
- Ссылка на файл квоты (обязательно)
- Сайзинг (Да/Нет)
- Приоритет (Срочно/Средние/Не срочно)
- Ответственный: Инна + Евгения Попова (если сайзинг = Да)

#### Квота для КП
- Ссылка на файл квоты (обязательно)
- Скидка (0% / 0–25% / 25–50% / Больше 50%)
- КП или Договор
- Сайзинг (Да/Нет)
- Срок согласования (дата)
- Ответственные по скидкам:
  - 0–25% или 25–50% → Егор
  - 50%+ → Егор + Лёша Х
  - Сайзинг = Да → Евгения Попова

### Валидация
- Все поля обязательные (кроме реквизитов компании в NDA)
- Подсветка ошибок красным
- Кнопка отправки активна только при валидной форме

### Todoist интеграция
- Автоматическое создание задач
- Приоритеты: 4 (Срочно) → 3 (Средние) → 2 (Не срочно) → 1 (Остальные)
- Форматированные заголовки и описания
- Автоматическое назначение ответственных

## Структура проекта

```
├── frontend/                 # React приложение
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   ├── services/         # API сервисы
│   │   ├── types/           # TypeScript типы
│   │   └── schemas/         # Схемы валидации
│   └── package.json
├── backend/                  # Express сервер
│   ├── src/
│   │   ├── controllers/     # Контроллеры
│   │   ├── services/        # Бизнес-логика
│   │   ├── routes/          # Маршруты
│   │   ├── middleware/      # Middleware
│   │   ├── types/          # TypeScript типы
│   │   └── config/         # Конфигурация
│   └── package.json
└── package.json             # Корневой package.json
```

## API Endpoints

### POST /api/submit
Отправка формы согласования квоты.

**Request Body:**
```json
{
  "companyName": "ООО Рога и Копыта",
  "requester": "Костя Поляков",
  "approvalType": "Квота для КП",
  "quotaFileUrl": "https://example.com/file.pdf",
  "discount": "25–50%",
  "quotationType": "КП",
  "sizing": "Да",
  "approvalDeadline": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123456789",
    "url": "https://app.todoist.com/app/task/123456789",
    "title": "Согласование квоты — ООО Рога и Копыта — КП",
    "description": "Описание задачи..."
  }
}
```

## Разработка

### Добавление новых полей
1. Обновите типы в `frontend/src/types/index.ts` и `backend/src/types/index.ts`
2. Добавьте валидацию в схемы
3. Обновите компоненты формы
4. Обновите Todoist сервис для обработки новых полей

### Изменение правил маршрутизации
Отредактируйте файл `backend/src/config/rules.config.json`

## Лицензия

MIT
