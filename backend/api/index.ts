import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Передаем управление express приложению
  // Vercel адаптирует Node.js req/res к VercelRequest/Response
  // @ts-ignore
  app(req, res);
}


