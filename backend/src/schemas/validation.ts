import { z } from 'zod';

const baseCore = z.object({
  requester: z.enum(['Костя Поляков', 'Кирилл Стасюкевич', 'Евгения Попова', 'Максим Короткевич', 'Сотрудник Dbrain'], {
    required_error: 'Выберите, кто запрашивает квоту',
  }),
  approvalType: z.enum([
    'Квота для КП',
    'Договор',
    'NDA',
    'Запрос на расход',
    'ДС',
    'Запрос на закупку сервисов в Dbrain',
  ], {
    required_error: 'Выберите тип согласования',
  }),
  requesterOtherName: z.string().optional(),
});

export const baseFormSchema = baseCore;

export const ndaFormSchema = baseCore.extend({
  approvalType: z.literal('NDA'),
  companyName: z.string().min(1, 'Название компании обязательно для заполнения'),
  companyDetails: z.string().min(1, 'Реквизиты компании обязательны для заполнения'),
  priority: z.enum(['Срочно', 'Средний'], {
    required_error: 'Выберите приоритет',
  }),
});

export const contractFormSchema = baseCore.extend({
  approvalType: z.literal('Договор'),
  companyName: z.string().min(1, 'Название компании обязательно для заполнения'),
  quotaFileUrl: z.string().url('Введите корректную ссылку на файл квоты'),
  sizing: z.enum(['Да', 'Нет'], {
    required_error: 'Выберите, требуется ли сайзинг',
  }),
  priority: z.enum(['Срочно', 'Средний', 'Не срочно'], {
    required_error: 'Выберите приоритет',
  }),
});

export const quotationFormSchema = baseCore.extend({
  approvalType: z.literal('Квота для КП'),
  companyName: z.string().min(1, 'Название компании обязательно для заполнения'),
  quotaFileUrl: z.string().url('Введите корректную ссылку на файл квоты'),
  discount: z.enum(['0%', '0–25%', '25–50%', 'Больше 50%'], {
    required_error: 'Выберите размер скидки',
  }),
  quotationType: z.enum(['КП', 'Договор'], {
    required_error: 'Выберите тип: КП или Договор',
  }),
  sizing: z.enum(['Да', 'Нет'], {
    required_error: 'Выберите, требуется ли сайзинг',
  }),
  approvalDeadline: z.string().refine(
    (date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    },
    {
      message: 'Срок согласования не может быть в прошлом',
    }
  ),
});

export const expenseRequestFormSchema = baseCore.extend({
  approvalType: z.literal('Запрос на расход'),
});

export const dsFormSchema = baseCore.extend({
  approvalType: z.literal('ДС'),
});

export const servicePurchaseFormSchema = baseCore.extend({
  approvalType: z.literal('Запрос на закупку сервисов в Dbrain'),
});

const discriminated = z.discriminatedUnion('approvalType', [
  ndaFormSchema,
  contractFormSchema,
  quotationFormSchema,
  expenseRequestFormSchema,
  dsFormSchema,
  servicePurchaseFormSchema,
]);

export const formSchema = discriminated.superRefine((_data, _ctx) => {
  // временно без доп. проверок для упрощённых типов
});

export type FormSchema = z.infer<typeof formSchema>;
