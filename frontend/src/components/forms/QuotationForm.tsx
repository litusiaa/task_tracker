import React from 'react';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface QuotationFormProps {
  quotaFileUrl: string;
  discount: string;
  quotationType: string;
  sizing: string;
  approvalDeadline: string;
  onQuotaFileUrlChange: (value: string) => void;
  onDiscountChange: (value: string) => void;
  onQuotationTypeChange: (value: string) => void;
  onSizingChange: (value: string) => void;
  onApprovalDeadlineChange: (value: string) => void;
  errors: {
    quotaFileUrl?: string;
    discount?: string;
    quotationType?: string;
    sizing?: string;
    approvalDeadline?: string;
  };
}

const discountOptions: { value: string; label: string }[] = [
  { value: '0%', label: '0%' },
  { value: '0–25%', label: '0–25%' },
  { value: '25–50%', label: '25–50%' },
  { value: 'Больше 50%', label: 'Больше 50%' },
];

const quotationTypes: { value: string; label: string }[] = [
  { value: 'КП', label: 'КП' },
  { value: 'Договор', label: 'Договор' },
];

const sizingOptions: { value: string; label: string }[] = [
  { value: 'Да', label: 'Да' },
  { value: 'Нет', label: 'Нет' },
];

export const QuotationForm: React.FC<QuotationFormProps> = ({
  quotaFileUrl,
  discount,
  quotationType,
  sizing,
  approvalDeadline,
  onQuotaFileUrlChange,
  onDiscountChange,
  onQuotationTypeChange,
  onSizingChange,
  onApprovalDeadlineChange,
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
        label="Скидка"
        error={errors.discount}
        required
      >
        <Select
          value={discount}
          onChange={onDiscountChange}
          options={discountOptions}
          placeholder="Выберите размер скидки"
          error={!!errors.discount}
        />
      </FormField>

      <FormField
        label="КП или Договор"
        error={errors.quotationType}
        required
      >
        <Select
          value={quotationType}
          onChange={onQuotationTypeChange}
          options={quotationTypes}
          placeholder="Выберите тип"
          error={!!errors.quotationType}
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
        label="Срок согласования"
        error={errors.approvalDeadline}
        required
      >
        <Input
          type="date"
          value={approvalDeadline}
          onChange={onApprovalDeadlineChange}
          error={!!errors.approvalDeadline}
        />
      </FormField>
    </div>
  );
};
