import React from 'react';
import { FormField } from '../ui/FormField';
import { Select } from '../ui/Select';
import { Requester, ApprovalType } from '../../types';

interface BaseFormProps {
  requester: string;
  approvalType: string;
  onRequesterChange: (value: string) => void;
  onApprovalTypeChange: (value: string) => void;
  errors: {
    requester?: string;
    approvalType?: string;
  };
}

const requesters: { value: Requester; label: string }[] = [
  { value: 'Костя Поляков', label: 'Костя Поляков' },
  { value: 'Кирилл Стасюкевич', label: 'Кирилл Стасюкевич' },
  { value: 'Есения Ли', label: 'Есения Ли' },
  { value: 'Сотрудник Dbrain', label: 'Сотрудник Dbrain' },
];

const approvalTypes: { value: ApprovalType; label: string }[] = [
  { value: 'Квота для КП', label: 'Квота для КП' },
  { value: 'Договор', label: 'Договор' },
  { value: 'NDA', label: 'NDA' },
  { value: 'Запрос на расход', label: 'Запрос на расход' },
  { value: 'ДС', label: 'ДС' },
  { value: 'Запрос на закупку сервисов в Dbrain', label: 'Запрос на закупку сервисов в Dbrain' },
];

export const BaseForm: React.FC<BaseFormProps> = ({
  requester,
  approvalType,
  onRequesterChange,
  onApprovalTypeChange,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <FormField
        label="Кто запрашивает?"
        error={errors.requester}
        required
      >
        <Select
          value={requester}
          onChange={onRequesterChange}
          options={requesters}
          placeholder="Выберите запрашивающего"
          error={!!errors.requester}
        />
      </FormField>

      {/* Убрано поле ввода имени для "Сотрудник Dbrain" */}

      <FormField
        label="Согласовать"
        error={errors.approvalType}
        required
      >
        <Select
          value={approvalType}
          onChange={onApprovalTypeChange}
          options={approvalTypes}
          placeholder="Выберите тип согласования"
          error={!!errors.approvalType}
        />
      </FormField>
    </div>
  );
};
