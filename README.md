# Analytical Dashboard

BI-приложение с редактируемыми дашбордами по отделам. MVP версия включает дашборд PM с метриками из Pipedrive.

## 🚀 Технологии

- **Frontend/Backend**: Next.js 14 (App Router, TypeScript, React Server Components)
- **UI**: TailwindCSS + shadcn/ui
- **Графики**: Recharts
- **База данных**: PostgreSQL + Prisma ORM
- **Хостинг**: Vercel
- **Кроны**: Vercel Cron (каждые 30 минут)

## 📋 Функциональность MVP

### Дашборд PM (Евгения Попова)

**KPI-карточки:**
- Запуск проектов, % (1 знак после запятой)
- Среднее время Integration→Pilot, дни (1 знак)
- Процент пропущенных сроков, % (1 знак)

**Виджеты:**
- Тренд: Запуск проектов, % по месяцам (MSK)
- Таблица исключений: сделки с просрочкой

**Фильтры:**
- Период: 01.01.2025 → сегодня (по умолчанию)
- Владелец: предзаполнено "Евгения Попова"

**Редактируемая сетка:**
- Drag & drop / resize виджетов
- Сохранение общей раскладки в БД

## 🛠 Установка и настройка

### 1. Клонирование репозитория

```bash
git clone <your-repo-url>
cd analytical-dashboard
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

Создайте файл `.env.local`:

```env
# Pipedrive API
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token_here
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1

# Sync security
SYNC_SECRET=your_sync_secret_here

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/analytical_dashboard

# App settings
APP_TIMEZONE=Europe/Moscow
```

### 4. Настройка базы данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Создание таблиц в БД
npm run db:push

# Или с миграциями
npm run db:migrate
```

### 5. Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

## 🗄 Структура базы данных

### Основные таблицы:

- `pd_users` - пользователи Pipedrive
- `pd_pipelines` - пайплайны
- `pd_stages` - этапы пайплайнов
- `pd_deals` - сделки
- `pd_stage_events` - история переходов по этапам
- `pm_metrics_cache` - кэш метрик
- `dashboard_layouts` - раскладки дашбордов
- `sync_logs` - логи синхронизации

## 🔄 Синхронизация с Pipedrive

### Автоматическая синхронизация

Крон-задача запускается каждые 30 минут и выполняет инкрементальную синхронизацию.

### Ручная синхронизация

```bash
# Полная синхронизация
curl -X POST "http://localhost:3000/api/sync/pipedrive?mode=full" \
  -H "Authorization: Bearer your_sync_secret"

# Инкрементальная синхронизация
curl -X POST "http://localhost:3000/api/sync/pipedrive?mode=inc" \
  -H "Authorization: Bearer your_sync_secret"
```

### Поддерживаемые пайплайны и этапы

**Leads:**
- Lead → Lead in progress

**Sales CIS:**
- E – Recognize → D – Evaluate → C – Select → B – Negotiate → A – Purchase

**Clients CIS:**
- Integration → Pilot → Active → Issued → Dormant → Lost

**Partner:**
- Хочу! → Potential → Engaged → Active → Dormant

## 📊 API Endpoints

### Метрики PM
```
GET /api/pm/metrics?from=2025-01-01&to=2025-12-31&ownerName=Евгения%20Попова
```

### Просроченные сделки
```
GET /api/pm/overdue?from=2025-01-01&to=2025-12-31&ownerName=Евгения%20Попова
```

### Раскладка дашборда
```
GET /api/dashboard-layouts/pm
PUT /api/dashboard-layouts/pm
```

### Синхронизация
```
POST /api/sync/pipedrive?mode=full|inc
```

## 🚀 Деплой на Vercel

### 1. Подключение репозитория

1. Создайте новый проект в Vercel
2. Подключите ваш GitHub репозиторий
3. Настройте переменные окружения в Vercel Dashboard

### 2. Переменные окружения в Vercel

Добавьте все переменные из `.env.local` в настройки проекта Vercel:

- `PIPEDRIVE_API_TOKEN`
- `PIPEDRIVE_BASE_URL`
- `SYNC_SECRET`
- `DATABASE_URL`
- `APP_TIMEZONE`

### 3. Настройка базы данных

Рекомендуется использовать Supabase или Neon для PostgreSQL:

1. Создайте базу данных
2. Скопируйте строку подключения в `DATABASE_URL`
3. Выполните миграции: `npm run db:push`

### 4. Настройка крон-задач

Крон-задачи автоматически настраиваются через `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync/pipedrive?mode=inc",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

## 🔧 Бизнес-логика

### Метрика "Запуск проектов"

- **Подписанные**: сделки, перешедшие из Sales CIS: A – Purchase в Clients CIS: Integration
- **Запущенные**: из подписанных, сделки в Clients CIS: Active
- **Формула**: (LaunchedCount / SignedCount) × 100

### Метрика "Пропущенные сроки"

- **Плановая дата**: поле "Ожидаемая дата закрытия" на момент входа в Sales CIS: E – Recognize
- **Факт запуска**: дата входа в Clients CIS: Active
- **Просрочка**: если fact_date > plan_date или (нет факта и today > plan_date)

### Метрика "Среднее время Integration → Pilot"

- **Расчет**: среднее время между первым входом в Integration и первым входом в Pilot
- **Единица**: календарные дни

## 🎨 Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── pm/                # PM dashboard page
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── dashboard/         # Dashboard widgets
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities and services
│   ├── db.ts            # Database service
│   ├── metrics.ts       # Metrics calculations
│   ├── pipedrive.ts     # Pipedrive API service
│   └── utils.ts         # Utility functions
└── types/               # TypeScript types
    └── index.ts         # Type definitions
```

## 🔒 Безопасность

- API токены Pipedrive хранятся только в переменных окружения
- Синхронизация защищена Bearer токеном
- Публичный доступ без авторизации (MVP)

## 📝 Логирование

Логи синхронизации сохраняются в таблице `sync_logs`:
- Время начала и окончания
- Статус (ok/error)
- Дополнительная информация

## 🐛 Отладка

### Просмотр логов

```bash
# Локально
npm run dev

# В Vercel
vercel logs
```

### Проверка синхронизации

```bash
# Проверка последнего синка
curl "http://localhost:3000/api/sync/logs"
```

### Тестирование API

```bash
# Тест метрик
curl "http://localhost:3000/api/pm/metrics?from=2025-01-01&to=2025-12-31"

# Тест просроченных
curl "http://localhost:3000/api/pm/overdue?from=2025-01-01&to=2025-12-31"
```

## 🔮 Планы развития

- [ ] Добавление других отделов (DS, CSM, Finance, Partner, Sales)
- [ ] Авторизация и ACL
- [ ] Персональные раскладки
- [ ] Экспорт данных (CSV/PNG)
- [ ] Интеграция с другими источниками (CarrotQuest, Gmail, Sheets)
- [ ] Уведомления о просрочках
- [ ] Мобильная версия

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи в Vercel Dashboard
2. Убедитесь в корректности переменных окружения
3. Проверьте подключение к базе данных
4. Убедитесь в наличии токена Pipedrive API

## 📄 Лицензия

MIT License
