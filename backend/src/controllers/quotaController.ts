import { Request, Response } from 'express';
import { getLinearService } from '../services/linear';
import { FormData, ApiResponse } from '../types';

export const submitQuotaRequest = async (req: Request, res: Response) => {
  try {
    const formData: FormData = req.body;

    // Всегда создаем задачу в Linear
    const created = await getLinearService().createTask(formData);

    // Формируем ответ
    const response: ApiResponse = {
      success: true,
      data: {
        id: created.id,
        url: created.url,
        title: created.title,
        description: created.description,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error submitting quota request:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Произошла ошибка при создании задачи',
    };

    res.status(500).json(response);
  }
};
