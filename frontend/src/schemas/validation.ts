import { z } from 'zod';

export const baseFormSchema = z.object({
  companyName: z.string().min(1, 'Название компании обязательно для заполнения'),
  requester: z.enum(['Костя Поляков', 'Кирилл Стасюкевич', 'Есения Ли'], {
    required_error: 'Выберите, кто запрашивает квоту',
  }),
  approvalType: z.enum(['Квота для КП', 'Договор', 'NDA'], {
    required_error: 'Выберите тип согласования',
  }),
});

const ndaCore = baseFormSchema.extend({
  approvalType: z.literal('NDA'),
  companyDetails: z.string().min(1, 'Реквизиты компании обязательны для заполнения'),
  companyFile: z.instanceof(File).optional(),
  priority: z.enum(['Срочные', 'Средние'], {
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
  priority: z.enum(['Срочно', 'Средние', 'Не срочно'], {
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

export const formSchema = z.discriminatedUnion('approvalType', [
  ndaFormSchema,
  contractFormSchema,
  quotationFormSchema,
]);

export type FormSchema = z.infer<typeof formSchema>;
