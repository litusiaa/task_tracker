import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, FormSchema } from '../schemas/validation';
import { submitForm } from '../services/api';
import { TodoistTask } from '../types';
import { BaseForm } from './forms/BaseForm';
import { NDAForm } from './forms/NDAForm';
import { ContractForm } from './forms/ContractForm';
import { QuotationForm } from './forms/QuotationForm';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export const QuotaForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTask, setSubmittedTask] = useState<TodoistTask | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const planner = ((import.meta as any).env?.VITE_PLANNER as string) || 'Todoist';

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  const approvalType = watch('approvalType');

  const onSubmit = async (data: FormSchema) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await submitForm(data as any);
      
      if (response.success && response.data) {
        setSubmittedTask(response.data);
      } else {
        setSubmitError(response.error || 'Произошла ошибка при отправке');
      }
    } catch (error) {
      setSubmitError('Произошла ошибка при отправке формы');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSectionForm = () => {
    if (!approvalType) return null;

    switch (approvalType) {
      case 'NDA':
        return (
          <NDAForm
            companyDetails={watch('companyDetails') || ''}
            companyFile={watch('companyFile')}
            priority={watch('priority') || ''}
            onCompanyDetailsChange={(value) => setValue('companyDetails', value)}
            onCompanyFileChange={(file) => setValue('companyFile', file)}
            onPriorityChange={(value) => setValue('priority', value as 'Срочные' | 'Средние')}
            errors={{
              companyDetails: (errors as any).companyDetails?.message as string | undefined,
              priority: (errors as any).priority?.message as string | undefined,
            }}
          />
        );
      case 'Договор':
        return (
          <ContractForm
            quotaFileUrl={watch('quotaFileUrl') || ''}
            sizing={watch('sizing') || ''}
            priority={watch('priority') || ''}
            onQuotaFileUrlChange={(value) => setValue('quotaFileUrl', value)}
            onSizingChange={(value) => setValue('sizing', value as 'Да' | 'Нет')}
            onPriorityChange={(value) => setValue('priority', value as 'Срочно' | 'Средние' | 'Не срочно')}
            errors={{
              quotaFileUrl: (errors as any).quotaFileUrl?.message as string | undefined,
              sizing: (errors as any).sizing?.message as string | undefined,
              priority: (errors as any).priority?.message as string | undefined,
            }}
          />
        );
      case 'Квота для КП':
        return (
          <QuotationForm
            quotaFileUrl={watch('quotaFileUrl') || ''}
            discount={watch('discount') || ''}
            quotationType={watch('quotationType') || ''}
            sizing={watch('sizing') || ''}
            approvalDeadline={watch('approvalDeadline') || ''}
            onQuotaFileUrlChange={(value) => setValue('quotaFileUrl', value)}
            onDiscountChange={(value) => setValue('discount', value as '0%' | '0–25%' | '25–50%' | 'Больше 50%')}
            onQuotationTypeChange={(value) => setValue('quotationType', value as 'КП' | 'Договор')}
            onSizingChange={(value) => setValue('sizing', value as 'Да' | 'Нет')}
            onApprovalDeadlineChange={(value) => setValue('approvalDeadline', value)}
            errors={{
              quotaFileUrl: (errors as any).quotaFileUrl?.message as string | undefined,
              discount: (errors as any).discount?.message as string | undefined,
              quotationType: (errors as any).quotationType?.message as string | undefined,
              sizing: (errors as any).sizing?.message as string | undefined,
              approvalDeadline: (errors as any).approvalDeadline?.message as string | undefined,
            }}
          />
        );
      default:
        return null;
    }
  };

  if (submittedTask) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-success-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Задача успешно создана!
          </h2>
          <p className="text-gray-600 mb-6">
            Задача отправлена в Todoist и ожидает обработки.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Детали задачи:</h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>ID:</strong> {submittedTask.id}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Название:</strong> {submittedTask.title}
            </p>
            <a
              href={submittedTask.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              {`Открыть в ${planner}`}
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </div>
          
          <button
            onClick={() => {
              setSubmittedTask(null);
              setSubmitError(null);
            }}
            className="btn-primary"
          >
            Создать новую задачу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        Согласование квот
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Общие поля */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Общая информация
          </h2>
          <BaseForm
            companyName={watch('companyName') || ''}
            requester={watch('requester') || ''}
            approvalType={watch('approvalType') || ''}
            onCompanyNameChange={(value) => setValue('companyName', value)}
            onRequesterChange={(value) => setValue('requester', value as any)}
            onApprovalTypeChange={(value) => setValue('approvalType', value as any)}
            errors={{
              companyName: errors.companyName?.message as string | undefined,
              requester: errors.requester?.message as string | undefined,
              approvalType: errors.approvalType?.message as string | undefined,
            }}
          />
        </div>

        {/* Динамический раздел */}
        {approvalType && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {approvalType === 'NDA' && 'Информация для NDA'}
              {approvalType === 'Договор' && 'Информация для Договора'}
              {approvalType === 'Квота для КП' && 'Информация для Квоты'}
            </h2>
            {renderSectionForm()}
          </div>
        )}

        {/* Ошибка отправки */}
        {submitError && (
          <div className="flex items-center p-4 bg-error-50 border border-error-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-error-500 mr-2" />
            <p className="text-error-700">{submitError}</p>
          </div>
        )}

        {/* Кнопка отправки */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`btn-primary ${!isValid || isSubmitting ? 'btn-disabled' : ''}`}
          >
            {isSubmitting ? 'Отправка...' : `Отправить в ${planner}`}
          </button>
        </div>
      </form>
    </div>
  );
};
