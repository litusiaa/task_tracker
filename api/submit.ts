import type { VercelRequest, VercelResponse } from '@vercel/node';
import { formSchema } from '../backend/src/schemas/validation';
import { getLinearService } from '../backend/src/services/linear';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const rawBody: any = (req as any).body;
    const data = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

    const parsed = formSchema.parse(data);
    const created = await getLinearService().createTask(parsed as any);

    return res.status(200).json({
      success: true,
      data: {
        id: created.id,
        url: created.url,
        title: created.title,
        description: created.description,
      },
    });
  } catch (error: any) {
    const message = error?.message || 'A server error has occurred';
    try { console.error('submit error', error); } catch {}
    return res.status(500).json({ success: false, error: message });
  }
}


