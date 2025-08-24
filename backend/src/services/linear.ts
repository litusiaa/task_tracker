import axios from 'axios';
import { FormData, TodoistTask } from '../types';
// Import JSON config in TS for Node on Vercel
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rulesConfig = require('../config/rules.config.json');

interface LinearIssueCreateResponse {
  data?: {
    issueCreate?: {
      success: boolean;
      issue?: { id: string; identifier: string; url: string; title: string; description?: string };
    };
  };
  errors?: Array<{ message: string }>;
}

interface LinearViewerResponse {
  data?: { viewer?: { id: string } };
}

class LinearService {
  private apiKey: string;
  private teamId?: string;
  private teamKey?: string;
  private baseUrl = 'https://api.linear.app/graphql';
  private assigneeId?: string;
  private projectId?: string;
  private projectName?: string;
  private workflowStateId?: string;
  private workflowStateName?: string;

  constructor() {
    this.apiKey = process.env.LINEAR_API_KEY || '';
    this.teamId = process.env.LINEAR_TEAM_ID || '';
    this.teamKey = process.env.LINEAR_TEAM_KEY || '';
    this.projectId = process.env.LINEAR_PROJECT_ID || '';
    this.projectName = process.env.LINEAR_PROJECT_NAME || '';
    this.workflowStateName = process.env.LINEAR_WORKFLOW_STATE_NAME || '';
    const explicitAssignee = process.env.LINEAR_ASSIGNEE_ID || '';

    if (!this.apiKey) {
      throw new Error('LINEAR_API_KEY is required');
    }
    if (!this.teamId && !this.teamKey) {
      throw new Error('Provide LINEAR_TEAM_ID or LINEAR_TEAM_KEY');
    }

    // Optional override for assignee
    if (explicitAssignee) {
      this.assigneeId = explicitAssignee;
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.apiKey,
    };
  }

  private async ensureAssignee() {
    if (this.assigneeId) return;
    const query = `query { viewer { id } }`;
    const resp = await axios.post<LinearViewerResponse>(this.baseUrl, { query }, { headers: this.getHeaders() });
    const id = resp.data.data?.viewer?.id;
    if (!id) throw new Error('Failed to resolve Linear viewer id');
    this.assigneeId = id;
  }

  private async ensureTeam() {
    if (this.teamId) return;
    const key = this.teamKey;
    if (!key) throw new Error('LINEAR_TEAM_KEY is missing');
    const query = `query TeamByKey($key: String!) { team(key: $key) { id key name } }`;
    const resp = await axios.post(this.baseUrl, { query, variables: { key } }, { headers: this.getHeaders() });
    const id = (resp.data as any)?.data?.team?.id as string | undefined;
    if (!id) throw new Error('Failed to resolve Linear team id by key');
    this.teamId = id;
  }

  private async ensureProject() {
    if (this.projectId) return;
    if (!this.projectName) return; // optional
    const query = `query ProjectByName($name: String!) {
      projects(filter: { name: { eq: $name } }, first: 1) {
        nodes { id name }
      }
    }`;
    const resp = await axios.post(this.baseUrl, { query, variables: { name: this.projectName } }, { headers: this.getHeaders() });
    const id = (resp.data as any)?.data?.projects?.nodes?.[0]?.id as string | undefined;
    if (id) this.projectId = id;
  }

  private async ensureWorkflowState() {
    if (this.workflowStateId) return;
    if (!this.workflowStateName) return; // optional
    await this.ensureTeam();
    const query = `query States($teamId: String!) {
      workflowStates(filter: { team: { id: { eq: $teamId } } }) { nodes { id name } }
    }`;
    const resp = await axios.post(this.baseUrl, { query, variables: { teamId: this.teamId } }, { headers: this.getHeaders() });
    const nodes = (resp.data as any)?.data?.workflowStates?.nodes as Array<{ id: string; name: string }> | undefined;
    const found = nodes?.find(s => s.name.toLowerCase() === (this.workflowStateName as string).toLowerCase());
    if (found) this.workflowStateId = found.id;
  }

  private getPriority(formData: FormData): number {
    const p = (formData as any).priority as string | undefined;
    if (p === 'Срочно' || p === 'Срочные') return 4; // Urgent
    if (p === 'Средние') return 2; // Medium
    if (p === 'Не срочно') return 1; // Low
    return 0; // No priority
  }

  private getTaskTitle(formData: FormData): string {
    const template = (rulesConfig.taskTitles as any)[formData.approvalType];
    if (!template) {
      return `Согласование — ${formData.companyName}`;
    }

    const priority = (formData as any).priority || '';

    return template
      .replace('{company}', formData.companyName)
      .replace('{priority}', priority)
      .replace('{quotationType}', (formData as any).quotationType || '');
  }

  private getTaskDescription(formData: FormData): string {
    const lines: string[] = [];
    lines.push(`Общая информация:`);
    lines.push(`• Компания: ${formData.companyName}`);
    lines.push(`• Запрашивающий: ${formData.requester}`);
    lines.push(`• Тип согласования: ${formData.approvalType}`);
    lines.push('');

    switch (formData.approvalType) {
      case 'NDA':
        lines.push(`Информация для NDA:`);
        lines.push(`• Реквизиты компании: ${(formData as any).companyDetails}`);
        lines.push(`• Приоритет: ${(formData as any).priority}`);
        break;
      case 'Договор':
        lines.push(`Информация для Договора:`);
        lines.push(`• Ссылка на файл квоты: ${(formData as any).quotaFileUrl}`);
        lines.push(`• Сайзинг: ${(formData as any).sizing}`);
        lines.push(`• Приоритет: ${(formData as any).priority}`);
        break;
      case 'Квота для КП':
        lines.push(`Информация для Квоты:`);
        lines.push(`• Ссылка на файл квоты: ${(formData as any).quotaFileUrl}`);
        lines.push(`• Скидка: ${(formData as any).discount}`);
        lines.push(`• Тип: ${(formData as any).quotationType}`);
        lines.push(`• Сайзинг: ${(formData as any).sizing}`);
        lines.push(`• Срок согласования: ${(formData as any).approvalDeadline}`);
        break;
    }

    // Примечание: дополнительные ответственные добавим в конец описания
    const responsibles = this.getResponsibles(formData);
    if (responsibles.length > 1) {
      lines.push('');
      lines.push(`Уведомить: ${responsibles.filter((r) => r !== rulesConfig.responsibles.default).join(', ')}`);
    }

    return lines.join('\n');
  }

  private getResponsibles(formData: FormData): string[] {
    const responsibles: string[] = [rulesConfig.responsibles.default];
    if ((formData as any).sizing === 'Да') {
      responsibles.push(rulesConfig.responsibles.sizing);
    }
    if (formData.approvalType === 'Квота для КП') {
      const discount = (formData as any).discount;
      if (discount === '0–25%') responsibles.push(rulesConfig.responsibles.discount_0_25);
      else if (discount === '25–50%') responsibles.push(rulesConfig.responsibles.discount_25_50);
      else if (discount === 'Больше 50%') responsibles.push(...rulesConfig.responsibles.discount_50_plus);
    }
    return [...new Set(responsibles)];
  }

  private getChecklistItems(formData: FormData): string[] {
    const items: string[] = [];
    items.push('Проверить корректность данных');
    items.push('Согласовать с заинтересованными сторонами');
    switch (formData.approvalType) {
      case 'NDA':
        items.push('Проверить реквизиты компании');
        items.push('Оценить риски');
        items.push('Подготовить документы для подписания');
        break;
      case 'Договор':
        items.push('Проверить файл квоты');
        if ((formData as any).sizing === 'Да') items.push('Провести сайзинг');
        items.push('Согласовать условия');
        items.push('Подготовить договор');
        break;
      case 'Квота для КП':
        items.push('Проверить файл квоты');
        items.push(`Оценить скидку: ${(formData as any).discount}`);
        if ((formData as any).sizing === 'Да') items.push('Провести сайзинг');
        items.push('Согласовать с финансовым отделом');
        items.push('Подготовить финальную квоту');
        break;
    }
    return items;
  }

  private getUserIds() {
    return {
      inna: process.env.LINEAR_USER_INNA_ID || '',
      egor: process.env.LINEAR_USER_EGOR_ID || '',
      alexH: process.env.LINEAR_USER_ALEXH_ID || '',
      zhenya: process.env.LINEAR_USER_ZHENYA_ID || '',
    };
  }

  private computeAssigneeChain(formData: FormData): string[] {
    const users = this.getUserIds();
    const chain: string[] = [];

    if (formData.approvalType === 'NDA') {
      if (users.inna) chain.push(users.inna);
      return chain;
    }

    if (formData.approvalType === 'Договор') {
      // Главная задача: без сайзинга — Инна; с сайзингом — Женя → Инна (как последовательные шаги)
      if (formData.sizing === 'Да') {
        if (users.zhenya) chain.push(users.zhenya);
        if (users.inna) chain.push(users.inna);
      } else {
        if (users.inna) chain.push(users.inna);
      }
      return chain;
    }

    if (formData.approvalType === 'Квота для КП') {
      const discount = (formData as any).discount as string;
      const sizing = (formData as any).sizing as string;
      const pushIf = (id?: string) => { if (id) chain.push(id); };

      if (sizing === 'Да') {
        // Сайзинг сначала Женя → затем финал Инна; согласующие пойдут параллельными подзадачами (см. ниже)
        pushIf(users.zhenya);
        pushIf(users.inna);
      } else {
        // Без сайзинга: основная на Инну, согласующие параллельно как подзадачи
        pushIf(users.inna);
      }
      return chain.filter(Boolean);
    }

    return chain;
  }

  private async createIssue(input: any): Promise<{ id: string; url: string; title: string; description?: string }> {
    const mutation = `mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url title description }
      }
    }`;
    const resp = await axios.post<LinearIssueCreateResponse>(this.baseUrl, { query: mutation, variables: { input } }, { headers: this.getHeaders() });
    const issue = resp.data.data?.issueCreate?.issue;
    if (!issue) throw new Error(`Linear API error: ${JSON.stringify(resp.data.errors || {})}`);
    return { id: issue.id, url: issue.url, title: issue.title, description: issue.description };
  }

  async createTask(formData: FormData): Promise<TodoistTask> { // reuse common shape
    await this.ensureAssignee();
    await this.ensureTeam();
    const title = this.getTaskTitle(formData);
    const description = this.getTaskDescription(formData);
    const priority = this.getPriority(formData);
    await this.ensureProject();
    await this.ensureWorkflowState();

    const chain = this.computeAssigneeChain(formData);
    const initialAssignee = chain[0] || this.assigneeId;

    const parent = await this.createIssue({
      teamId: this.teamId!,
      title,
      description,
      priority,
      assigneeId: initialAssignee,
      projectId: this.projectId,
      stateId: this.workflowStateId,
    });

    // add checklist items as sub-issues (contextual todo list)
    const checklist = this.getChecklistItems(formData);
    for (const content of checklist) {
      await this.createIssue({
        teamId: this.teamId!,
        title: content,
        parentId: parent.id,
        assigneeId: initialAssignee,
        projectId: this.projectId,
        stateId: this.workflowStateId,
      });
    }

    // Parallel approvers for discount > 50% (Егор и Лёша одновременно)
    if (formData.approvalType === 'Квота для КП') {
      const users = this.getUserIds();
      const discount = (formData as any).discount as string;
      const sizing = (formData as any).sizing as string;

      const createParallel = async (title: string, assignee: string | undefined) => {
        if (!assignee) return;
        await this.createIssue({
          teamId: this.teamId!,
          title,
          parentId: parent.id,
          assigneeId: assignee,
          projectId: this.projectId,
          stateId: this.workflowStateId,
        });
      };

      if (discount === 'Больше 50%') {
        // Если сайзинг да — Женя уже стоит как первый исполнитель основной задачи; параллельные согласующие идут подзадачами
        await createParallel('Параллельное согласование: Егор', users.egor);
        await createParallel('Параллельное согласование: Лёша Х', users.alexH);
      }

      if ((discount === '0–25%' || discount === '25–50%') && sizing !== 'Да') {
        // Для 0–50 без сайзинга: параллельным делаем только Егора, финал — Инна по основной цепочке
        await createParallel('Параллельное согласование: Егор', users.egor);
      }
    }

    return { id: parent.id, url: parent.url, title: parent.title, description: parent.description || '' };
  }
}

export const linearService = new LinearService();


