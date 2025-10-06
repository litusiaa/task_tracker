import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs20.x' } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const rawBody: any = (req as any).body;
    const data = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

    // Lazy-load modules to surface import-time errors
    const { formSchema } = await import('../backend/src/schemas/validation');
    const { getLinearService } = await import('../backend/src/services/linear');

    const parsed = (formSchema as any).parse(data);
    const created = await (getLinearService as any)().createTask(parsed as any);

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
    const message = (error?.message || 'A server error has occurred') + (error?.stack ? `\n${error.stack}` : '');
    try { console.error('submit error', error); } catch {}
    return res.status(500).json({ success: false, error: message });
  }
}


