import { z } from 'zod';

export const baseFormSchema = z.object({
  companyName: z.string().min(1, 'Название компании обязательно для заполнения'),
  requester: z.enum(['Костя Поляков', 'Кирилл Стасюкевич', 'Есения Ли', 'Сотрудник Dbrain'], {
    required_error: 'Выберите, кто запрашивает квоту',
  }),
  approvalType: z.enum(['Квота для КП', 'Договор', 'NDA'], {
    required_error: 'Выберите тип согласования',
  }),
  // упрощено: больше не требуется ввода имени сотрудника
});

const ndaCore = baseFormSchema.extend({
  approvalType: z.literal('NDA'),
  companyDetails: z.string().min(1, 'Реквизиты компании обязательны для заполнения'),
  companyFile: z.instanceof(File).optional(),
  priority: z.enum(['Срочно', 'Средний'], {
    required_error: 'Выберите приоритет',
  }),
});

export const ndaFormSchema = ndaCore.refine(
  (data) => data.companyDetails.trim().length > 0 || data.companyFile,
  {
    message: 'Необходимо заполнить реквизиты компании или загрузить файл',
    path: ['companyDetails'],
  }
);

export const contractFormSchema = baseFormSchema.extend({
  approvalType: z.literal('Договор'),
  quotaFileUrl: z.string().url('Введите корректную ссылку на файл квоты'),
  sizing: z.enum(['Да', 'Нет'], {
    required_error: 'Выберите, требуется ли сайзинг',
  }),
  priority: z.enum(['Срочно', 'Средний', 'Не срочно'], {
    required_error: 'Выберите приоритет',
  }),
});

export const quotationFormSchema = baseFormSchema.extend({
  approvalType: z.literal('Квота для КП'),
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
    (value) => {
      if (!value) return false;
      const selected = new Date(value);
      return selected.getTime() >= Date.now();
    },
    { message: 'Срок согласования не может быть в прошлом' }
  ),
});

// New forms
// TEMP: минимальная версия — только выбор типа. Поля добавим в UI позже
export const expenseRequestFormSchema = baseFormSchema.extend({
  approvalType: z.literal('Запрос на расход'),
});

export const dsFormSchema = baseFormSchema.extend({
  approvalType: z.literal('ДС'),
});

export const servicePurchaseFormSchema = baseFormSchema.extend({
  approvalType: z.literal('Запрос на закупку сервисов в Dbrain'),
});

const discriminated = z.discriminatedUnion('approvalType', [
  ndaCore,
  contractFormSchema,
  quotationFormSchema,
  expenseRequestFormSchema,
  dsFormSchema,
  servicePurchaseFormSchema,
]);

export const formSchema = discriminated.superRefine((data, ctx) => {
  // NDA: либо реквизиты, либо файл
  if (data.approvalType === 'NDA') {
    const details = (data as any).companyDetails as string | undefined;
    const file = (data as any).companyFile as File | undefined;
    if (!(details && details.trim().length > 0) && !file) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Необходимо заполнить реквизиты компании или загрузить файл',
        path: ['companyDetails'],
      });
    }
  }
  // Разрешаем выбирать «Сотрудник Dbrain» без дополнительного имени
  // Доп. проверки для новых типов временно отключены, пока не добавим UI
});

export type FormSchema = z.infer<typeof formSchema>;
