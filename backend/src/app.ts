import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Загружаем переменные окружения ДО импорта роутов/сервисов
dotenv.config();

import quotaRoutes from './routes/quotaRoutes';

const app = express();

// CORS: в проде на Vercel лучше отражать Origin, а не жестко задавать
app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Маршруты
app.use('/api', quotaRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Обработка ошибок
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Маршрут не найден' });
});

export default app;


