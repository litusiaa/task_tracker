import axios from 'axios';
import { TodoistCreateTaskRequest, TodoistCreateTaskResponse, FormData } from '../types';
import rulesConfig from '../config/rules.config.json';

interface TodoistUser {
  id: string;
  name: string;
  email: string;
}

interface TodoistProject {
  id: string;
  name: string;
}

interface TodoistSection {
  id: string;
  name: string;
  project_id: string;
}

class TodoistService {
  private token: string;
  private sectionId: string;
  private baseUrl = 'https://api.todoist.com/rest/v2';
  private projectId?: string;
  private assigneeId?: string;

  constructor() {
    this.token = process.env.TODOIST_TOKEN || '';
    this.sectionId = process.env.TODOIST_SECTION_ID || '';
    
    if (!this.token) {
      throw new Error('TODOIST_TOKEN is required');
    }
    if (!this.sectionId) {
      throw new Error('TODOIST_SECTION_ID is required');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private async initialize() {
    if (!this.projectId || !this.assigneeId) {
      await this.fetchProjectAndAssignee();
    }
  }

  private async fetchProjectAndAssignee() {
    try {
      // Получаем информацию о текущем пользователе
      const userResponse = await axios.get<TodoistUser>(
        `${this.baseUrl}/user`,
        { headers: this.getHeaders() }
      );
      this.assigneeId = userResponse.data.id;

      // Получаем информацию о секции и проекте
      const sectionResponse = await axios.get<TodoistSection>(
        `${this.baseUrl}/sections/${this.sectionId}`,
        { headers: this.getHeaders() }
      );
      this.projectId = sectionResponse.data.project_id;

      console.log(`✅ Todoist initialized: Project ID: ${this.projectId}, Assignee ID: ${this.assigneeId}`);
    } catch (error) {
      console.error('Error initializing Todoist service:', error);
      throw new Error('Failed to initialize Todoist service');
    }
  }

  private getPriority(formData: FormData): number {
    let priority: string;
    if (formData.approvalType === 'NDA') {
      priority = formData.priority;
    } else if (formData.approvalType === 'Договор') {
      priority = formData.priority;
    } else {
      // Для квот используем средний приоритет по умолчанию
      priority = 'Средние';
    }
    return (rulesConfig.priorities as any)[priority] || rulesConfig.priorities.default;
  }

  private getTaskTitle(formData: FormData): string {
    const template = (rulesConfig.taskTitles as any)[formData.approvalType];
    if (!template) {
      return `Согласование — ${formData.companyName}`;
    }

    let priority = '';
    if (formData.approvalType === 'NDA') {
      priority = formData.priority;
    } else if (formData.approvalType === 'Договор') {
      priority = formData.priority;
    }

    return template
      .replace('{company}', formData.companyName)
      .replace('{priority}', priority)
      .replace('{quotationType}', (formData as any).quotationType || '');
  }

  private getTaskDescription(formData: FormData): string {
    const lines: string[] = [];
    
    // Общая информация
    lines.push(`**Общая информация:**`);
    lines.push(`• Компания: ${formData.companyName}`);
    lines.push(`• Запрашивающий: ${formData.requester}`);
    lines.push(`• Тип согласования: ${formData.approvalType}`);
    lines.push(``);

    // Специфичная информация по типам
    switch (formData.approvalType) {
      case 'NDA':
        lines.push(`**Информация для NDA:**`);
        lines.push(`• Реквизиты компании: ${formData.companyDetails}`);
        lines.push(`• Приоритет: ${formData.priority}`);
        break;

      case 'Договор':
        lines.push(`**Информация для Договора:**`);
        lines.push(`• Ссылка на файл квоты: ${formData.quotaFileUrl}`);
        lines.push(`• Сайзинг: ${formData.sizing}`);
        lines.push(`• Приоритет: ${formData.priority}`);
        break;

      case 'Квота для КП':
        lines.push(`**Информация для Квоты:**`);
        lines.push(`• Ссылка на файл квоты: ${formData.quotaFileUrl}`);
        lines.push(`• Скидка: ${formData.discount}`);
        lines.push(`• Тип: ${formData.quotationType}`);
        lines.push(`• Сайзинг: ${formData.sizing}`);
        lines.push(`• Срок согласования: ${formData.approvalDeadline}`);
        break;
    }

    return lines.join('\n');
  }

  private getResponsibles(formData: FormData): string[] {
    const responsibles: string[] = [rulesConfig.responsibles.default];

    // Добавляем ответственных по правилам
    if (formData.approvalType === 'Договор' && formData.sizing === 'Да') {
      responsibles.push(rulesConfig.responsibles.sizing);
    }

    if (formData.approvalType === 'Квота для КП') {
      const discount = formData.discount;
      if (discount === '0–25%') {
        responsibles.push(rulesConfig.responsibles.discount_0_25);
      } else if (discount === '25–50%') {
        responsibles.push(rulesConfig.responsibles.discount_25_50);
      } else if (discount === 'Больше 50%') {
        responsibles.push(...rulesConfig.responsibles.discount_50_plus);
      }
      
      if (formData.sizing === 'Да') {
        responsibles.push(rulesConfig.responsibles.sizing);
      }
    }

    // Убираем дубликаты
    return [...new Set(responsibles)];
  }

  private getChecklistItems(formData: FormData): string[] {
    const items: string[] = [];

    // Базовые задачи для всех типов
    items.push('Проверить корректность данных');
    items.push('Согласовать с заинтересованными сторонами');

    // Специфичные задачи по типам
    switch (formData.approvalType) {
      case 'NDA':
        items.push('Проверить реквизиты компании');
        items.push('Оценить риски');
        items.push('Подготовить документы для подписания');
        break;

      case 'Договор':
        items.push('Проверить файл квоты');
        if (formData.sizing === 'Да') {
          items.push('Провести сайзинг');
        }
        items.push('Согласовать условия');
        items.push('Подготовить договор');
        break;

      case 'Квота для КП':
        items.push('Проверить файл квоты');
        items.push(`Оценить скидку: ${formData.discount}`);
        if (formData.sizing === 'Да') {
          items.push('Провести сайзинг');
        }
        items.push('Согласовать с финансовым отделом');
        items.push('Подготовить финальную квоту');
        break;
    }

    return items;
  }

  async createTask(formData: FormData): Promise<TodoistCreateTaskResponse> {
    await this.initialize();

    const taskData: TodoistCreateTaskRequest = {
      content: this.getTaskTitle(formData),
      description: this.getTaskDescription(formData),
      project_id: this.projectId!,
      section_id: this.sectionId,
      assignee_id: this.assigneeId!,
      priority: this.getPriority(formData),
      labels: this.getResponsibles(formData),
    };

    // Добавляем срок для квот
    if (formData.approvalType === 'Квота для КП') {
      taskData.due_string = formData.approvalDeadline;
    }

    try {
      const response = await axios.post<TodoistCreateTaskResponse>(
        `${this.baseUrl}/tasks`,
        taskData,
        { headers: this.getHeaders() }
      );

      // Добавляем чеклист как подзадачи
      await this.addChecklistItems(response.data.id, formData);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Todoist API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  private async addChecklistItems(taskId: string, formData: FormData) {
    const checklistItems = this.getChecklistItems(formData);

    try {
      // Создаем подзадачи для каждого пункта чеклиста
      for (const item of checklistItems) {
        await axios.post(
          `${this.baseUrl}/tasks`,
          {
            content: item,
            parent_id: taskId,
            project_id: this.projectId!,
            section_id: this.sectionId,
            assignee_id: this.assigneeId!,
          },
          { headers: this.getHeaders() }
        );
      }

      console.log(`✅ Added ${checklistItems.length} checklist items to task ${taskId}`);
    } catch (error) {
      console.error('Error adding checklist items:', error instanceof Error ? error.message : 'Unknown error');
      // Не прерываем выполнение, если не удалось добавить чеклист
    }
  }
}

export const todoistService = new TodoistService();
