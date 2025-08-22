import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Передаём управление express приложению
  // @ts-ignore - совместимость типов
  return app(req, res);
}


