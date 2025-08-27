import React from 'react';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';

interface ExpenseRequestFormProps {
  expenseName: string;
  expenseDescription: string;
  expenseAmountCurrency: string;
  expenseType: string;
  expenseGoal: string;
  expenseGoalExplanation: string;
  contactTelegram: string;
  onChange: (field: string, value: any) => void;
  errors?: Partial<Record<string, string>>;
}

const expenseTypeOptions = [
  { value: 'Разовая', label: 'Разовая' },
  { value: 'Периодичная', label: 'Периодичная' },
];

const expenseGoalOptions = [
  { value: 'Серьезная экономия текущих ресурсов', label: 'Серьезная экономия текущих ресурсов' },
  { value: 'Привлечение новых клиентов', label: 'Привлечение новых клиентов' },
  { value: 'Необходимо в рамках работы с текущими клиентами', label: 'Необходимо в рамках работы с текущими клиентами' },
  { value: 'Для разработки текущего продукта', label: 'Для разработки текущего продукта' },
  { value: 'Другое', label: 'Другое' },
];

export const ExpenseRequestForm: React.FC<ExpenseRequestFormProps> = ({
  expenseName,
  expenseDescription,
  expenseAmountCurrency,
  expenseType,
  expenseGoal,
  expenseGoalExplanation,
  contactTelegram,
  onChange,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <FormField label="Название расхода" error={errors?.expenseName} required>
        <Input value={expenseName} onChange={(v) => onChange('expenseName', v)} placeholder="Например, подписка" />
      </FormField>

      <FormField label="Описание расхода" error={errors?.expenseDescription} required>
        <Textarea value={expenseDescription} onChange={(v) => onChange('expenseDescription', v)} placeholder="Короткое описание" />
      </FormField>

      <FormField label="Сумма и валюта" error={errors?.expenseAmountCurrency} required>
        <Input value={expenseAmountCurrency} onChange={(v) => onChange('expenseAmountCurrency', v)} placeholder="Например, 19 990 ₽" />
      </FormField>

      <FormField label="Это разовая трата или периодичная?" error={errors?.expenseType} required>
        <Select value={expenseType} onChange={(v) => onChange('expenseType', v)} options={expenseTypeOptions} placeholder="Выберите тип" />
      </FormField>

      <FormField label="Какую задачу решает этот расход?" error={errors?.expenseGoal} required>
        <Select value={expenseGoal} onChange={(v) => onChange('expenseGoal', v)} options={expenseGoalOptions} placeholder="Выберите задачу" />
      </FormField>

      <FormField label="Пояснение к выбранной задаче" error={errors?.expenseGoalExplanation} required>
        <Textarea value={expenseGoalExplanation} onChange={(v) => onChange('expenseGoalExplanation', v)} placeholder="Пояснения" />
      </FormField>

      <FormField label="Имя и Telegram ответственного" error={errors?.contactTelegram} required>
        <Input value={contactTelegram} onChange={(v) => onChange('contactTelegram', v)} placeholder="Имя, @username" />
      </FormField>
    </div>
  );
};


