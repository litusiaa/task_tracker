import React from 'react';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';

interface ServicePurchaseFormProps {
  serviceName: string;
  serviceAccessDate: string;
  serviceDescription: string;
  serviceGoals: string[];
  goalEconomyDescription?: string;
  goalClientDescription?: string;
  goalProductDescription?: string;
  serviceCostCurrency: string;
  paymentPeriodicity: string;
  purchaseDuration: string;
  serviceOrigin: string;
  contactTelegram: string;
  onChange: (field: string, value: any) => void;
  errors?: Partial<Record<string, string>>;
}

const goalOptions = [
  { value: 'Серьезная экономия текущих ресурсов', label: 'Серьезная экономия текущих ресурсов' },
  { value: 'Для клиента', label: 'Для клиента' },
  { value: 'Для нашего продукта в целом', label: 'Для нашего продукта в целом' },
];

const periodicity = [
  { value: 'Единоразовый', label: 'Единоразовый' },
  { value: 'Ежемесячный', label: 'Ежемесячный' },
  { value: 'Ежегодный', label: 'Ежегодный' },
];

const durations = [
  { value: '1 месяц', label: '1 месяц' },
  { value: '2–3 месяца', label: '2–3 месяца' },
  { value: 'Бессрочно', label: 'Бессрочно' },
];

const origin = [
  { value: 'Российский', label: 'Российский' },
  { value: 'Иностранный', label: 'Иностранный' },
];

export const ServicePurchaseForm: React.FC<ServicePurchaseFormProps> = (props) => {
  const {
    serviceName,
    serviceAccessDate,
    serviceDescription,
    serviceGoals,
    goalEconomyDescription,
    goalClientDescription,
    goalProductDescription,
    serviceCostCurrency,
    paymentPeriodicity,
    purchaseDuration,
    serviceOrigin,
    contactTelegram,
    onChange,
    errors,
  } = props;

  const toggleGoal = (goal: string) => {
    const set = new Set(serviceGoals);
    set.has(goal) ? set.delete(goal) : set.add(goal);
    onChange('serviceGoals', Array.from(set));
  };

  const checked = (goal: string) => serviceGoals.includes(goal);

  return (
    <div className="space-y-4">
      <FormField label="Название сервиса" error={errors?.serviceName} required>
        <Input value={serviceName} onChange={(v) => onChange('serviceName', v)} placeholder="Например, Notion" />
      </FormField>
      <FormField label="Когда нужен доступ к сервису?" error={errors?.serviceAccessDate} required>
        <Input type="date" value={serviceAccessDate} onChange={(v) => onChange('serviceAccessDate', v)} />
      </FormField>
      <FormField label="Опишите сервис" error={errors?.serviceDescription} required>
        <Textarea value={serviceDescription} onChange={(v) => onChange('serviceDescription', v)} />
      </FormField>

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-900">Какую задачу решает сервис?</div>
        {goalOptions.map((g) => (
          <label key={g.value} className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={checked(g.value)} onChange={() => toggleGoal(g.value)} />
            <span>{g.label}</span>
          </label>
        ))}
      </div>

      {checked('Серьезная экономия текущих ресурсов') && (
        <FormField label="Опишите экономию текущих ресурсов" error={errors?.goalEconomyDescription} required>
          <Textarea value={goalEconomyDescription || ''} onChange={(v) => onChange('goalEconomyDescription', v)} />
        </FormField>
      )}
      {checked('Для клиента') && (
        <FormField label="Что доработать и для какого клиента" error={errors?.goalClientDescription} required>
          <Textarea value={goalClientDescription || ''} onChange={(v) => onChange('goalClientDescription', v)} />
        </FormField>
      )}
      {checked('Для нашего продукта в целом') && (
        <FormField label="Опишите доработку" error={errors?.goalProductDescription} required>
          <Textarea value={goalProductDescription || ''} onChange={(v) => onChange('goalProductDescription', v)} />
        </FormField>
      )}

      <FormField label="Стоимость (с валютой)" error={errors?.serviceCostCurrency} required>
        <Input value={serviceCostCurrency} onChange={(v) => onChange('serviceCostCurrency', v)} placeholder="19 990 ₽ / $10" />
      </FormField>
      <FormField label="Периодичность платежа" error={errors?.paymentPeriodicity} required>
        <Select value={paymentPeriodicity} onChange={(v) => onChange('paymentPeriodicity', v)} options={periodicity} placeholder="Выберите" />
      </FormField>
      <FormField label="Срок закупки" error={errors?.purchaseDuration} required>
        <Select value={purchaseDuration} onChange={(v) => onChange('purchaseDuration', v)} options={durations} placeholder="Выберите" />
      </FormField>
      <FormField label="Происхождение сервиса" error={errors?.serviceOrigin} required>
        <Select value={serviceOrigin} onChange={(v) => onChange('serviceOrigin', v)} options={origin} placeholder="Выберите" />
      </FormField>
      <FormField label="Имя и Telegram ответственного" error={errors?.contactTelegram} required>
        <Input value={contactTelegram} onChange={(v) => onChange('contactTelegram', v)} placeholder="Имя, @username" />
      </FormField>
    </div>
  );
};


