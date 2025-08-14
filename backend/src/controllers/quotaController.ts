import { Request, Response } from 'express';
import { todoistService } from '../services/todoist';
import { FormData, ApiResponse } from '../types';

export const submitQuotaRequest = async (req: Request, res: Response) => {
  try {
    const formData: FormData = req.body;

    // Создаем задачу в Todoist
    const todoistTask = await todoistService.createTask(formData);

    // Формируем ответ
    const response: ApiResponse = {
      success: true,
      data: {
        id: todoistTask.id,
        url: todoistTask.url,
        title: todoistTask.content,
        description: todoistTask.description,
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
