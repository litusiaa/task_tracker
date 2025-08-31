import { Router } from 'express';
import { submitQuotaRequest } from '../controllers/quotaController';
import { validateRequest } from '../middleware/validation';
import { formSchema } from '../schemas/validation';

const router = Router();

// GET /api/health - простая проверка доступности API
router.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// POST /api/submit - Отправка формы согласования квоты
router.post('/submit', validateRequest(formSchema), submitQuotaRequest);

export default router;
