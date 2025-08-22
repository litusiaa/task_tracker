import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Запуск обычного сервера (локально/на любом VM/PAAS). На Vercel использовать backend/api/index.ts
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Timezone: ${process.env.TIMEZONE || 'Europe/Moscow'}`);
  console.log(`📋 Todoist Section ID: ${process.env.TODOIST_SECTION_ID || 'Not set'}`);
});
