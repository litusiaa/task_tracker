import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../backend/src/app';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // @ts-ignore Express req/res compatible
  return app(req, res);
}


