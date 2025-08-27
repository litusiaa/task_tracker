import React from 'react';
import { FormField } from '../ui/FormField';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';

interface DSFormProps {
  dsType: string;
  dsDescription: string;
  onChange: (field: string, value: any) => void;
  errors?: Partial<Record<string, string>>;
}

const dsTypes = [
  { value: 'Продление сроков', label: 'Продление сроков' },
  { value: 'Изменение условий', label: 'Изменение условий' },
];

export const DSForm: React.FC<DSFormProps> = ({ dsType, dsDescription, onChange, errors }) => {
  return (
    <div className="space-y-4">
      <FormField label="Вид ДС" error={errors?.dsType} required>
        <Select value={dsType} onChange={(v) => onChange('dsType', v)} options={dsTypes} placeholder="Выберите вид" />
      </FormField>
      <FormField label="Описание" error={errors?.dsDescription} required>
        <Textarea value={dsDescription} onChange={(v) => onChange('dsDescription', v)} placeholder="Опишите выбранный вариант" />
      </FormField>
    </div>
  );
};


