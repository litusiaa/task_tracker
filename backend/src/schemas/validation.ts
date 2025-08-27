import { z } from 'zod';

const baseCore = z.object({
  companyName: z.string().min(1, 'Название компании обязательно для заполнения'),
  requester: z.enum(['Костя Поляков', 'Кирилл Стасюкевич', 'Есения Ли', 'Сотрудник Dbrain'], {
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
  // упрощено: имя сотрудника не требуется
});

export const baseFormSchema = baseCore;

export const ndaFormSchema = baseCore.extend({
  approvalType: z.literal('NDA'),
  companyDetails: z.string().min(1, 'Реквизиты компании обязательны для заполнения'),
  priority: z.enum(['Срочно', 'Средний'], {
    required_error: 'Выберите приоритет',
  }),
});

export const contractFormSchema = baseCore.extend({
  approvalType: z.literal('Договор'),
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
  approvalType: z.literal('Согласовать: Запрос на расход'),
  expenseName: z.string().min(1, 'Название расхода обязательно'),
  expenseDescription: z.string().min(1, 'Описание расхода обязательно'),
  expenseAmountCurrency: z.string().min(1, 'Укажите сумму и валюту'),
  expenseType: z.enum(['Разовая', 'Периодичная'], { required_error: 'Выберите тип траты' }),
  expenseGoal: z.enum([
    'Серьезная экономия текущих ресурсов',
    'Привлечение новых клиентов',
    'Необходимо в рамках работы с текущими клиентами',
    'Для разработки текущего продукта',
    'Другое',
  ], { required_error: 'Выберите задачу расхода' }),
  expenseGoalExplanation: z.string().min(1, 'Добавьте пояснение по задаче расхода'),
  contactTelegram: z.string().min(1, 'Укажите контакт в Telegram'),
});

export const dsFormSchema = baseCore.extend({
  approvalType: z.literal('Согласовать: ДС'),
  dsType: z.enum(['Продление сроков', 'Изменение условий'], { required_error: 'Выберите вид ДС' }),
  dsDescription: z.string().min(1, 'Опишите выбранный вариант'),
});

export const servicePurchaseFormSchema = baseCore.extend({
  approvalType: z.literal('Согласовать: Запрос на закупку сервисов в Dbrain'),
  serviceName: z.string().min(1, 'Название сервиса обязательно'),
  serviceAccessDate: z.string().min(1, 'Укажите дату доступа'),
  serviceDescription: z.string().min(1, 'Опишите сервис'),
  serviceGoals: z.array(
    z.enum(['Серьезная экономия текущих ресурсов', 'Для клиента', 'Для нашего продукта в целом'])
  ).min(1, 'Выберите хотя бы одну задачу'),
  goalEconomyDescription: z.string().optional(),
  goalClientDescription: z.string().optional(),
  goalProductDescription: z.string().optional(),
  serviceCostCurrency: z.string().min(1, 'Укажите стоимость с валютой'),
  paymentPeriodicity: z.enum(['Единоразовый', 'Ежемесячный', 'Ежегодный'], { required_error: 'Выберите периодичность' }),
  purchaseDuration: z.enum(['1 месяц', '2–3 месяца', 'Бессрочно'], { required_error: 'Выберите срок закупки' }),
  serviceOrigin: z.enum(['Российский', 'Иностранный'], { required_error: 'Выберите происхождение сервиса' }),
  contactTelegram: z.string().min(1, 'Укажите контакт в Telegram'),
});

const discriminated = z.discriminatedUnion('approvalType', [
  ndaFormSchema,
  contractFormSchema,
  quotationFormSchema,
  expenseRequestFormSchema,
  dsFormSchema,
  servicePurchaseFormSchema,
]);

export const formSchema = discriminated.superRefine((data, ctx) => {
  // Доп. проверка имени сотрудника, если выбран вариант "Сотрудник Dbrain"
  if ((data as any).requester === 'Сотрудник Dbrain' && !((data as any).requesterOtherName && (data as any).requesterOtherName.trim().length > 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Укажите имя сотрудника', path: ['requesterOtherName'] });
  }
  // Динамические пояснения по целям сервиса
  if (data.approvalType === 'Согласовать: Запрос на закупку сервисов в Dbrain') {
    const goals = (data as any).serviceGoals as string[];
    if (goals?.includes('Серьезная экономия текущих ресурсов') && !(data as any).goalEconomyDescription) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Опишите экономию текущих ресурсов', path: ['goalEconomyDescription'] });
    }
    if (goals?.includes('Для клиента') && !(data as any).goalClientDescription) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Опишите, что доработать и для какого клиента', path: ['goalClientDescription'] });
    }
    if (goals?.includes('Для нашего продукта в целом') && !(data as any).goalProductDescription) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Опишите доработку для продукта', path: ['goalProductDescription'] });
    }
  }
});

export type FormSchema = z.infer<typeof formSchema>;
