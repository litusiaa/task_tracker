export type Requester = 'Костя Поляков' | 'Кирилл Стасюкевич' | 'Есения Ли';

export type ApprovalType = 'Квота для КП' | 'Договор' | 'NDA';

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
  companyFile?: File;
  priority: 'Срочные' | 'Средние';
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

export type FormData = NDAFormData | ContractFormData | QuotationFormData;

export interface TodoistTask {
  id: string;
  url: string;
  title: string;
  description: string;
}

export interface ApiResponse {
  success: boolean;
  data?: TodoistTask;
  error?: string;
}
