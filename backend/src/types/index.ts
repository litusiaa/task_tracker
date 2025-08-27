export type Requester = 'Костя Поляков' | 'Кирилл Стасюкевич' | 'Есения Ли' | 'Сотрудник Dbrain';

export type ApprovalType =
  | 'Квота для КП'
  | 'Договор'
  | 'NDA'
  | 'Запрос на расход'
  | 'ДС'
  | 'Запрос на закупку сервисов в Dbrain';

export type Priority = 'Срочно' | 'Средний' | 'Не срочно';

export type Discount = '0%' | '0–25%' | '25–50%' | 'Больше 50%';

export type QuotationType = 'КП' | 'Договор';

export type Sizing = 'Да' | 'Нет';

export interface BaseFormData {
  companyName: string;
  requester: Requester;
  approvalType: ApprovalType;
}

export interface NDAFormData extends BaseFormData {
  approvalType: 'NDA';
  companyDetails: string;
  companyFile?: Express.Multer.File;
  priority: 'Срочно' | 'Средний';
}

export interface ContractFormData extends BaseFormData {
  approvalType: 'Договор';
  quotaFileUrl: string;
  sizing: Sizing;
  priority: Priority;
}

export interface QuotationFormData extends BaseFormData {
  approvalType: 'Квота для КП';
  quotaFileUrl: string;
  discount: Discount;
  quotationType: QuotationType;
  sizing: Sizing;
  approvalDeadline: string;
}

export interface ExpenseRequestFormData extends BaseFormData {
  approvalType: 'Запрос на расход';
  expenseName: string;
  expenseDescription: string;
  expenseAmountCurrency: string;
  expenseType: 'Разовая' | 'Периодичная';
  expenseGoal:
    | 'Серьезная экономия текущих ресурсов'
    | 'Привлечение новых клиентов'
    | 'Необходимо в рамках работы с текущими клиентами'
    | 'Для разработки текущего продукта'
    | 'Другое';
  expenseGoalExplanation: string;
  contactTelegram: string;
}

export interface DSFormData extends BaseFormData {
  approvalType: 'ДС';
  dsType: 'Продление сроков' | 'Изменение условий';
  dsDescription: string;
}

export interface ServicePurchaseFormData extends BaseFormData {
  approvalType: 'Запрос на закупку сервисов в Dbrain';
  serviceName: string;
  serviceAccessDate: string;
  serviceDescription: string;
  serviceGoals: Array<'Серьезная экономия текущих ресурсов' | 'Для клиента' | 'Для нашего продукта в целом'>;
  goalEconomyDescription?: string;
  goalClientDescription?: string;
  goalProductDescription?: string;
  serviceCostCurrency: string;
  paymentPeriodicity: 'Единоразовый' | 'Ежемесячный' | 'Ежегодный';
  purchaseDuration: '1 месяц' | '2–3 месяца' | 'Бессрочно';
  serviceOrigin: 'Российский' | 'Иностранный';
  contactTelegram: string;
}

export type FormData =
  | NDAFormData
  | ContractFormData
  | QuotationFormData
  | ExpenseRequestFormData
  | DSFormData
  | ServicePurchaseFormData;

export interface TodoistTask {
  id: string;
  url: string;
  title: string;
  description: string;
}

export interface TodoistCreateTaskRequest {
  content: string;
  description?: string;
  project_id: string;
  section_id?: string;
  assignee_id?: string;
  priority: number;
  due_string?: string;
  labels?: string[];
  parent_id?: string;
}

export interface TodoistCreateTaskResponse {
  id: string;
  url: string;
  content: string;
  description: string;
}

export interface ApiResponse {
  success: boolean;
  data?: TodoistTask;
  error?: string;
}
