import React from 'react';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface ContractFormProps {
  quotaFileUrl: string;
  sizing: string;
  priority: string;
  onQuotaFileUrlChange: (value: string) => void;
  onSizingChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  errors: {
    quotaFileUrl?: string;
    sizing?: string;
    priority?: string;
  };
}

const sizingOptions: { value: string; label: string }[] = [
  { value: 'Да', label: 'Да' },
  { value: 'Нет', label: 'Нет' },
];

const priorities: { value: string; label: string }[] = [
  { value: 'Срочно', label: 'Срочно (≤ 4 ч, >10 млн в год или стратегический клиент)' },
  { value: 'Средний', label: 'Средний (≤ 1 день, 9,9–3 млн в год)' },
  { value: 'Не срочно', label: 'Не срочно (до 2 дней, все остальные договоры)' },
];

export const ContractForm: React.FC<ContractFormProps> = ({
  quotaFileUrl,
  sizing,
  priority,
  onQuotaFileUrlChange,
  onSizingChange,
  onPriorityChange,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <FormField
        label="Ссылка на файл квоты"
        error={errors.quotaFileUrl}
        required
      >
        <Input
          type="url"
          value={quotaFileUrl}
          onChange={onQuotaFileUrlChange}
          placeholder="https://example.com/file.pdf"
          error={!!errors.quotaFileUrl}
        />
      </FormField>

      <FormField
        label="Сайзинг"
        error={errors.sizing}
        required
      >
        <Select
          value={sizing}
          onChange={onSizingChange}
          options={sizingOptions}
          placeholder="Выберите, требуется ли сайзинг"
          error={!!errors.sizing}
        />
      </FormField>

      <FormField
        label="Приоритет"
        error={errors.priority}
        required
      >
        <Select
          value={priority}
          onChange={onPriorityChange}
          options={priorities}
          placeholder="Выберите приоритет"
          error={!!errors.priority}
        />
      </FormField>
    </div>
  );
};
