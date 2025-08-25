import React from 'react';
import { FormField } from '../ui/FormField';
import { Textarea } from '../ui/Textarea';
import { FileUpload } from '../ui/FileUpload';
import { Select } from '../ui/Select';

interface NDAFormProps {
  companyDetails: string;
  companyFile?: File;
  priority: string;
  onCompanyDetailsChange: (value: string) => void;
  onCompanyFileChange: (file: File) => void;
  onPriorityChange: (value: string) => void;
  errors: {
    companyDetails?: string;
    priority?: string;
  };
}

const priorities: { value: string; label: string }[] = [
  { value: 'Срочно', label: 'Срочно: срок подготовки — не более, чем пол дня (4 часа)' },
  { value: 'Средний', label: 'Средний: срок подготовки — не более, чем 1 день' },
];

export const NDAForm: React.FC<NDAFormProps> = ({
  companyDetails,
  companyFile,
  priority,
  onCompanyDetailsChange,
  onCompanyFileChange,
  onPriorityChange,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <FormField
        label="Реквизиты компании"
        error={errors.companyDetails}
        required
      >
        <div className="space-y-3">
          <Textarea
            value={companyDetails}
            onChange={onCompanyDetailsChange}
            placeholder="Введите реквизиты компании"
            error={!!errors.companyDetails}
          />
          <div className="text-sm text-gray-600">или</div>
          <FileUpload
            onFileSelect={onCompanyFileChange}
            selectedFile={companyFile}
            error={!!errors.companyDetails}
          />
        </div>
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
