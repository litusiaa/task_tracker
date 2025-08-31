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
  private workflowStateIdInProgress?: string;

  constructor() {
    this.apiKey = process.env.LINEAR_API_KEY || '';
    this.teamId = process.env.LINEAR_TEAM_ID || '';
    this.teamKey = process.env.LINEAR_TEAM_KEY || '';
    this.projectId = process.env.LINEAR_PROJECT_ID || '';
    this.projectName = process.env.LINEAR_PROJECT_NAME || '';
    this.workflowStateName = process.env.LINEAR_WORKFLOW_STATE_NAME || '';
    this.workflowStateId = process.env.LINEAR_WORKFLOW_STATE_ID || '';
    this.workflowStateIdInProgress = process.env.LINEAR_WORKFLOW_STATE_ID_IN_PROGRESS || '';
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

  private getTargetStateId(): string | undefined {
    return this.workflowStateIdInProgress || this.workflowStateId;
  }

  private async ensureInProgressState() {
    if (this.workflowStateIdInProgress) return;
    await this.ensureTeam();
    const query = `query States($teamId: String!) {
      workflowStates(filter: { team: { id: { eq: $teamId } } }) { nodes { id name } }
    }`;
    const resp = await axios.post(this.baseUrl, { query, variables: { teamId: this.teamId } }, { headers: this.getHeaders() });
    const nodes = (resp.data as any)?.data?.workflowStates?.nodes as Array<{ id: string; name: string }> | undefined;
    const found = nodes?.find(s => {
      const n = (s.name || '').toLowerCase();
      return n === 'in progress' || n === 'в работе' || n.includes('progress');
    });
    if (found) this.workflowStateIdInProgress = found.id;
  }

  // Linear priority mapping (API expects 0..4 where 1=Urgent, 2=High, 3=Medium, 4=Low)
  // Urgent (1) только для: NDA(Срочно) и Договор(Срочно)
  private getLinearPriority(formData: FormData): number {
    const p = (formData as any).priority as string | undefined;
    if ((formData.approvalType === 'NDA' && p === 'Срочно') || (formData.approvalType === 'Договор' && p === 'Срочно')) {
      return 1; // Urgent
    }
    if (p === 'Срочно') return 2; // High
    if (p === 'Средний') return 3; // Medium
    if (p === 'Не срочно') return 4; // Low
    return 0; // No priority
  }

  private computeDueDate(formData: FormData): string | undefined {
    // Linear dueDate expects a date string (YYYY-MM-DD). Trim time if provided.
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
    if (formData.approvalType === 'Квота для КП') {
      const dd = (formData as any).approvalDeadline as string | undefined;
      if (dd) {
        const d = new Date(dd);
        return toDateStr(d);
      }
    }
    const p = (formData as any).priority as string | undefined;
    const now = new Date();
    if (p === 'Срочно') {
      return toDateStr(now);
    }
    if (p === 'Средний') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return toDateStr(d);
    }
    if (p === 'Не срочно') {
      const d = new Date(now);
      d.setDate(d.getDate() + 2);
      return toDateStr(d);
    }
    return undefined;
  }

  private getTaskTitle(formData: FormData): string {
    const toReadablePriority = (): string => {
      const p = (formData as any).priority as string | undefined;
      if (!p) return '';
      if (p === 'Срочно') return 'срочно';
      if (p === 'Средний') return 'средне';
      if (p === 'Не срочно') return 'не срочно';
      return '';
    };

    let action = '';
    switch (formData.approvalType) {
      case 'Квота для КП':
        action = 'Согласовать квоту';
        break;
      case 'Договор':
        action = 'Согласовать договор';
        break;
      case 'NDA':
        action = 'Согласовать NDA';
        break;
      case 'Запрос на расход': {
        const name = (formData as any).expenseName || '';
        return name ? `Запрос на расход · ${name}` : 'Запрос на расход';
      }
      case 'ДС': {
        return `ДС · ${formData.companyName}`;
      }
      case 'Запрос на закупку сервисов в Dbrain': {
        const svc = (formData as any).serviceName || '';
        return svc ? `Запрос на закупку сервисов Dbrain · ${svc}` : 'Запрос на закупку сервисов Dbrain';
      }
      default:
        action = 'Согласовать';
    }

    const pr = toReadablePriority();
    return pr ? `${action}. Приоритет — ${pr}` : action;
  }

  private getTaskDescription(formData: FormData): string {
    const lines: string[] = [];
    lines.push(`Информация:`);
    lines.push(`• Тип согласования: ${formData.approvalType}`);
    lines.push(`• Запрашивающий: ${formData.requester}`);
    lines.push(`• Компания: ${formData.companyName}`);

    if (formData.approvalType === 'Запрос на расход') {
      lines.push(`• Название расхода: ${(formData as any).expenseName}`);
      lines.push(`• Описание расхода: ${(formData as any).expenseDescription}`);
      lines.push(`• Сумма и валюта: ${(formData as any).expenseAmountCurrency}`);
      lines.push(`• Тип траты: ${(formData as any).expenseType}`);
      lines.push(`• Цель: ${(formData as any).expenseGoal}`);
      lines.push(`• Пояснение: ${(formData as any).expenseGoalExplanation}`);
      lines.push(`• Контакт: ${(formData as any).contactTelegram}`);
    }
    if (formData.approvalType === 'ДС') {
      lines.push(`• Вид ДС: ${(formData as any).dsType}`);
      lines.push(`• Описание: ${(formData as any).dsDescription}`);
    }
    if (formData.approvalType === 'Запрос на закупку сервисов в Dbrain') {
      lines.push(`• Название сервиса: ${(formData as any).serviceName}`);
      lines.push(`• Когда нужен доступ: ${(formData as any).serviceAccessDate}`);
      lines.push(`• Описание: ${(formData as any).serviceDescription}`);
      lines.push(`• Задачи: ${(formData as any).serviceGoals?.join(', ')}`);
      if ((formData as any).goalEconomyDescription) lines.push(`• Экономия: ${(formData as any).goalEconomyDescription}`);
      if ((formData as any).goalClientDescription) lines.push(`• Для клиента: ${(formData as any).goalClientDescription}`);
      if ((formData as any).goalProductDescription) lines.push(`• Для продукта: ${(formData as any).goalProductDescription}`);
      lines.push(`• Стоимость: ${(formData as any).serviceCostCurrency}`);
      lines.push(`• Периодичность платежа: ${(formData as any).paymentPeriodicity}`);
      lines.push(`• Срок закупки: ${(formData as any).purchaseDuration}`);
      lines.push(`• Происхождение сервиса: ${(formData as any).serviceOrigin}`);
      lines.push(`• Контакт: ${(formData as any).contactTelegram}`);
    }

    if (formData.approvalType === 'NDA') {
      lines.push(`• Реквизиты компании: ${(formData as any).companyDetails}`);
      lines.push(`• Приоритет: ${(formData as any).priority}`);
    }
    if (formData.approvalType === 'Договор') {
      lines.push(`• Ссылка на файл квоты: ${(formData as any).quotaFileUrl}`);
      lines.push(`• Сайзинг: ${(formData as any).sizing}`);
      lines.push(`• Приоритет: ${(formData as any).priority}`);
    }
    if (formData.approvalType === 'Квота для КП') {
      lines.push(`• Ссылка на файл квоты: ${(formData as any).quotaFileUrl}`);
      lines.push(`• Скидка: ${(formData as any).discount}`);
      lines.push(`• Тип: ${(formData as any).quotationType}`);
      lines.push(`• Сайзинг: ${(formData as any).sizing}`);
      lines.push(`• Срок согласования: ${(formData as any).approvalDeadline}`);
    }

    // Примечание: дополнительные ответственные (НЕ для простых типов)
    const isSimple = (
      formData.approvalType === 'Запрос на расход' ||
      formData.approvalType === 'Запрос на закупку сервисов в Dbrain' ||
      formData.approvalType === 'ДС'
    );
    if (!isSimple) {
      const responsibles = this.getResponsibles(formData);
      if (responsibles.length > 1) {
        lines.push('');
        lines.push(`Уведомить: ${responsibles.filter((r) => r !== rulesConfig.responsibles.default).join(', ')}`);
      }
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
      inna: (process.env.LINEAR_USER_INNA_ID || '').trim(),
      egor: (process.env.LINEAR_USER_EGOR_ID || '').trim(),
      alexH: (process.env.LINEAR_USER_ALEXH_ID || '').trim(),
      zhenya: (process.env.LINEAR_USER_ZHENYA_ID || '').trim(),
      kostya: (process.env.LINEAR_USER_KOSTYA_ID || '').trim(),
      esenya: (process.env.LINEAR_USER_ESENYA_ID || '').trim(),
      kira: (process.env.LINEAR_USER_KIRA_ID || '').trim(),
      katya: (process.env.LINEAR_USER_KATYA_ID || '').trim(),
    };
  }

  private computeAssigneeChain(formData: FormData): string[] {
    const users = this.getUserIds();
    const chain: string[] = [];

    // Новые типы: ДС → Инна; Расход/Закупка сервисов → Катя
    if (formData.approvalType === 'ДС') {
      if (users.inna) chain.push(users.inna);
      return chain;
    }
    if (
      formData.approvalType === 'Запрос на расход' ||
      formData.approvalType === 'Запрос на закупку сервисов в Dbrain'
    ) {
      if (users.katya) chain.push(users.katya);
      return chain;
    }

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
    try {
      const resp = await axios.post<LinearIssueCreateResponse>(
        this.baseUrl,
        { query: mutation, variables: { input } },
        { headers: this.getHeaders() }
      );
      const issue = resp.data.data?.issueCreate?.issue;
      if (!issue) throw new Error(`Linear API error: ${JSON.stringify(resp.data.errors || {})}`);
      return { id: issue.id, url: issue.url, title: issue.title, description: issue.description };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const details = (error.response?.data as any)?.errors || error.response?.data;
        throw new Error(`Linear API HTTP ${status}: ${JSON.stringify(details)}`);
      }
      throw error;
    }
  }

  async createTask(formData: FormData): Promise<TodoistTask> { // reuse common shape
    await this.ensureAssignee();
    await this.ensureTeam();
    await this.ensureInProgressState();
    const title = this.getTaskTitle(formData);
    let description = this.getTaskDescription(formData);
    const priority = this.getLinearPriority(formData);
    const dueDate = this.computeDueDate(formData);
    await this.ensureProject();
    await this.ensureWorkflowState();

    const users = this.getUserIds();
    const chain = this.computeAssigneeChain(formData);
    const isSimpleType = (
      formData.approvalType === 'Запрос на расход' ||
      formData.approvalType === 'Запрос на закупку сервисов в Dbrain' ||
      formData.approvalType === 'ДС'
    );
    // Основной исполнитель: для простых типов — Катя, иначе Инна (или цепочка)
    const initialAssignee = isSimpleType
      ? (users.katya || this.assigneeId)
      : (users.inna || chain[0] || this.assigneeId);

    // Матрица подписчиков (соисполнители): Женя по сайзингу, Егор по скидке
    const subscribers: string[] = [];
    const sizingVal = (formData as any).sizing as string | undefined;
    const discountVal = (formData as any).discount as string | undefined;
    // reuse isSimpleType computed above
    if (!isSimpleType) {
      if (sizingVal === 'Да' && users.zhenya) subscribers.push(users.zhenya);
      if (['0–25%', '25–50%', 'Больше 50%'].includes(discountVal || '') && users.egor) {
        subscribers.push(users.egor);
      }
    }
    const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    const uniqSubs = Array.from(new Set(subscribers)).filter((v) => !!v && isUuid(v));

    // Префикс «Участники …» в описании
    const namesById: Record<string, string> = {};
    if (users.inna) namesById[users.inna] = 'Инна';
    if (users.zhenya) namesById[users.zhenya] = 'Евгения Попова';
    if (users.egor) namesById[users.egor] = 'Егор';
    const participants = [initialAssignee, ...uniqSubs].filter((v): v is string => typeof v === 'string' && v.length > 0);
    if (participants.length > 0) {
      const line = 'Участники: ' + participants.map(id => `@${namesById[id] || 'user'}`).join(', ');
      description = `${line}\n\n${description}`;
    }

    // Build input conditionally to avoid sending empty strings to Linear (causes UUID errors)
    const parentInput: any = {
      teamId: this.teamId!,
      title,
      description,
      priority,
      assigneeId: initialAssignee,
    };
    if (this.projectId) parentInput.projectId = this.projectId;
    const targetState = this.getTargetStateId();
    if (targetState) parentInput.stateId = targetState;
    if (uniqSubs.length > 0) parentInput.subscriberIds = uniqSubs;

    if (dueDate) parentInput.dueDate = dueDate;
    let parent;
    try {
      parent = await this.createIssue(parentInput);
    } catch (e: any) {
      const msg = (e?.message || '').toString();
      if (msg.includes('subscriberIds')) {
        // Повторяем без подписчиков, если хотя бы один ID неподтверждён в Linear
        delete parentInput.subscriberIds;
        parent = await this.createIssue(parentInput);
      } else {
        throw e;
      }
    }

    // Создаём подзадачи по правилам (сайзинг/скидка) — только для сложных типов (не для Расход/Закупка/ДС)
    const children: Array<{ title: string; assigneeId: string }> = [];
    if (!isSimpleType) {
      const shouldZhenya = sizingVal === 'Да' && users.zhenya && isUuid(users.zhenya);
      const shouldEgor = ['0–25%', '25–50%', 'Больше 50%'].includes(discountVal || '') && users.egor && isUuid(users.egor);
      if (shouldZhenya) {
        const company = (formData as any).companyName || '';
        children.push({ title: `Сайзинг · ${company}`.trim(), assigneeId: users.zhenya });
      }
      if (shouldEgor) {
        const company = (formData as any).companyName || '';
        const disc = discountVal || '';
        const t = ['0–25%', '25–50%', 'Больше 50%'].includes(disc) ? `Согласовать скидку · ${disc} · ${company}` : `Согласовать скидку · ${company}`;
        children.push({ title: t.trim(), assigneeId: users.egor });
      }
    }
    for (const child of children) {
      const childInput: any = {
        teamId: this.teamId!,
        title: child.title,
        assigneeId: child.assigneeId,
        parentId: parent.id,
      };
      if (this.projectId) childInput.projectId = this.projectId;
      if (targetState) childInput.stateId = targetState;

      const childIsEgor = child.assigneeId === users.egor;
      try {
        await this.createIssue(childInput);
      } catch (e1: any) {
        // Fallback 1: пробуем без assignee, но с подписчиком (если это задача для Егора)
        const childInputNoAssignee: any = { ...childInput };
        delete childInputNoAssignee.assigneeId;
        if (childIsEgor && users.egor && isUuid(users.egor)) {
          childInputNoAssignee.subscriberIds = [users.egor];
        }
        try {
          await this.createIssue(childInputNoAssignee);
        } catch (e2: any) {
          // Fallback 2: создаём без подписчиков вообще
          const childInputPlain: any = { ...childInputNoAssignee };
          delete childInputPlain.subscriberIds;
          try {
            await this.createIssue(childInputPlain);
          } catch (e3) {
            // не блокируем родителя из‑за ошибки саб‑задачи
          }
        }
      }
    }

    return { id: parent.id, url: parent.url, title: parent.title, description: parent.description || '' };
  }
}

export const linearService = new LinearService();


