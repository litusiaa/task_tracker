import { Request, Response } from 'express';
import { todoistService } from '../services/todoist';
import { linearService } from '../services/linear';
import { FormData, ApiResponse } from '../types';

export const submitQuotaRequest = async (req: Request, res: Response) => {
  try {
    const formData: FormData = req.body;

    // Выбор планера по ENV: LINEAR_API_KEY присутствует — создаем задачу в Linear, иначе Todoist
    const useLinear = !!process.env.LINEAR_API_KEY && !!process.env.LINEAR_TEAM_ID;
    const created = useLinear
      ? await linearService.createTask(formData)
      : await todoistService.createTask(formData);

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
