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
import { ExpenseRequestForm } from './forms/ExpenseRequestForm';
import { DSForm } from './forms/DSForm';
import { ServicePurchaseForm } from './forms/ServicePurchaseForm';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export const QuotaForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTask, setSubmittedTask] = useState<TodoistTask | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const planner = 'Linear';

  const {
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  // Ensure RHF validates and updates isValid when we change values programmatically
  const setField = (name: keyof FormSchema | any, value: any) =>
    setValue(name as any, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

  const approvalType = watch('approvalType');
  const isSimpleType = ['Запрос на расход', 'ДС', 'Запрос на закупку сервисов в Dbrain'].includes(
    (approvalType as any) || ''
  );
  const companyName = watch('companyName');
  const requesterVal = watch('requester');
  const hasBase = Boolean(companyName && requesterVal && approvalType);
  const canSubmit = isSimpleType ? hasBase : isValid;

  const onSubmit = async (data: FormSchema) => {
    // Debug trace to verify submission is triggered in browser
    try { console.log('Submitting form payload', data); } catch {}
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
            companyName={watch('companyName') || ''}
            companyDetails={watch('companyDetails') || ''}
            companyFile={watch('companyFile')}
            priority={watch('priority') || ''}
            onCompanyNameChange={(v) => setField('companyName', v)}
            onCompanyDetailsChange={(value) => setField('companyDetails', value)}
            onCompanyFileChange={(file) => setField('companyFile', file)}
            onPriorityChange={(value) => setField('priority', value as 'Срочно' | 'Средний')}
            errors={{
              companyName: (errors as any).companyName?.message as string | undefined,
              companyDetails: (errors as any).companyDetails?.message as string | undefined,
              priority: (errors as any).priority?.message as string | undefined,
            }}
          />
        );
      case 'Договор':
        return (
          <ContractForm
            companyName={watch('companyName') || ''}
            quotaFileUrl={watch('quotaFileUrl') || ''}
            sizing={watch('sizing') || ''}
            priority={watch('priority') || ''}
            onCompanyNameChange={(v) => setField('companyName', v)}
            onQuotaFileUrlChange={(value) => setField('quotaFileUrl', value)}
            onSizingChange={(value) => setField('sizing', value as 'Да' | 'Нет')}
            onPriorityChange={(value) => setField('priority', value as 'Срочно' | 'Средний' | 'Не срочно')}
            errors={{
              companyName: (errors as any).companyName?.message as string | undefined,
              quotaFileUrl: (errors as any).quotaFileUrl?.message as string | undefined,
              sizing: (errors as any).sizing?.message as string | undefined,
              priority: (errors as any).priority?.message as string | undefined,
            }}
          />
        );
      case 'Квота для КП':
        return (
          <QuotationForm
            companyName={watch('companyName') || ''}
            quotaFileUrl={watch('quotaFileUrl') || ''}
            discount={watch('discount') || ''}
            quotationType={watch('quotationType') || ''}
            sizing={watch('sizing') || ''}
            approvalDeadline={watch('approvalDeadline') || ''}
            onCompanyNameChange={(v) => setField('companyName', v)}
            onQuotaFileUrlChange={(value) => setField('quotaFileUrl', value)}
            onDiscountChange={(value) => setField('discount', value as '0%' | '0–25%' | '25–50%' | 'Больше 50%')}
            onQuotationTypeChange={(value) => setField('quotationType', value as 'КП' | 'Договор')}
            onSizingChange={(value) => setField('sizing', value as 'Да' | 'Нет')}
            onApprovalDeadlineChange={(value) => setField('approvalDeadline', value)}
            errors={{
              companyName: (errors as any).companyName?.message as string | undefined,
              quotaFileUrl: (errors as any).quotaFileUrl?.message as string | undefined,
              discount: (errors as any).discount?.message as string | undefined,
              quotationType: (errors as any).quotationType?.message as string | undefined,
              sizing: (errors as any).sizing?.message as string | undefined,
              approvalDeadline: (errors as any).approvalDeadline?.message as string | undefined,
            }}
          />
        );
      case 'Запрос на расход':
        return (
          <ExpenseRequestForm
            expenseName={watch('expenseName') || ''}
            expenseDescription={watch('expenseDescription') || ''}
            expenseAmountCurrency={watch('expenseAmountCurrency') || ''}
            expenseType={watch('expenseType') || ''}
            expenseGoal={watch('expenseGoal') || ''}
            expenseGoalExplanation={watch('expenseGoalExplanation') || ''}
            contactTelegram={watch('contactTelegram') || ''}
            onChange={(field, value) => setField(field as any, value)}
            errors={{
              expenseName: (errors as any).expenseName?.message as string | undefined,
              expenseDescription: (errors as any).expenseDescription?.message as string | undefined,
              expenseAmountCurrency: (errors as any).expenseAmountCurrency?.message as string | undefined,
              expenseType: (errors as any).expenseType?.message as string | undefined,
              expenseGoal: (errors as any).expenseGoal?.message as string | undefined,
              expenseGoalExplanation: (errors as any).expenseGoalExplanation?.message as string | undefined,
              contactTelegram: (errors as any).contactTelegram?.message as string | undefined,
            }}
          />
        );
      case 'ДС':
        return (
          <DSForm
            dsType={watch('dsType') || ''}
            dsDescription={watch('dsDescription') || ''}
            onChange={(field, value) => setField(field as any, value)}
            errors={{
              dsType: (errors as any).dsType?.message as string | undefined,
              dsDescription: (errors as any).dsDescription?.message as string | undefined,
            }}
          />
        );
      case 'Запрос на закупку сервисов в Dbrain':
        return (
          <ServicePurchaseForm
            serviceName={watch('serviceName') || ''}
            serviceAccessDate={watch('serviceAccessDate') || ''}
            serviceDescription={watch('serviceDescription') || ''}
            serviceGoals={watch('serviceGoals') || []}
            goalEconomyDescription={watch('goalEconomyDescription') || ''}
            goalClientDescription={watch('goalClientDescription') || ''}
            goalProductDescription={watch('goalProductDescription') || ''}
            serviceCostCurrency={watch('serviceCostCurrency') || ''}
            paymentPeriodicity={watch('paymentPeriodicity') || ''}
            purchaseDuration={watch('purchaseDuration') || ''}
            serviceOrigin={watch('serviceOrigin') || ''}
            contactTelegram={watch('contactTelegram') || ''}
            onChange={(field, value) => setField(field as any, value)}
            errors={{
              serviceName: (errors as any).serviceName?.message as string | undefined,
              serviceAccessDate: (errors as any).serviceAccessDate?.message as string | undefined,
              serviceDescription: (errors as any).serviceDescription?.message as string | undefined,
              goalEconomyDescription: (errors as any).goalEconomyDescription?.message as string | undefined,
              goalClientDescription: (errors as any).goalClientDescription?.message as string | undefined,
              goalProductDescription: (errors as any).goalProductDescription?.message as string | undefined,
              serviceCostCurrency: (errors as any).serviceCostCurrency?.message as string | undefined,
              paymentPeriodicity: (errors as any).paymentPeriodicity?.message as string | undefined,
              purchaseDuration: (errors as any).purchaseDuration?.message as string | undefined,
              serviceOrigin: (errors as any).serviceOrigin?.message as string | undefined,
              contactTelegram: (errors as any).contactTelegram?.message as string | undefined,
            }}
          />
        );
      // case 'Согласовать: Запрос на расход':
      //   return (
      //     <ExpenseRequestForm .../>
      //   );
      // case 'Согласовать: ДС':
      //   return (
      //     <DSForm .../>
      //   );
      // case 'Согласовать: Запрос на закупку сервисов в Dbrain':
      //   return (
      //     <ServicePurchaseForm .../>
      //   );
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
            Задача отправлена в Linear и ожидает обработки.
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
      <div className="relative flex items-center justify-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Согласование квот
        </h1>
        <svg
          className="absolute right-6 -top-2 w-10 h-10 text-primary-500"
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="8,45 18,15 26,18 16,48" stroke="currentColor" stroke-width="3" fill="none"/>
          <polygon points="26,48 30,12 40,12 36,48" stroke="currentColor" stroke-width="3" fill="none"/>
          <polygon points="38,48 48,20 56,26 46,50" stroke="currentColor" stroke-width="3" fill="none"/>
        </svg>
      </div>

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
            onCompanyNameChange={(value) => setField('companyName', value)}
            onRequesterChange={(value) => setField('requester', value as any)}
            onApprovalTypeChange={(value) => setField('approvalType', value as any)}
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
              {approvalType === 'Согласовать: Запрос на расход' && 'Информация по расходу'}
              {approvalType === 'Согласовать: ДС' && 'Информация по ДС'}
              {approvalType === 'Согласовать: Запрос на закупку сервисов в Dbrain' && 'Информация по закупке сервиса'}
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
            type="button"
            disabled={isSubmitting || !canSubmit}
            className={`btn-primary ${isSubmitting || !canSubmit ? 'btn-disabled' : ''}`}
            onClick={() => {
              // Явно вызываем RHF submit; кнопка не сабмитит форму напрямую
              try { console.log('Submit button clicked', { isSubmitting, canSubmit, approvalType }); } catch {}
              if (!isSubmitting && canSubmit) {
                try {
                  if (isSimpleType) {
                    const payload = getValues() as any;
                    try { console.log('Submitting form payload (simple)', payload); } catch {}
                    onSubmit(payload);
                  } else {
                    (handleSubmit(onSubmit, (errs: any) => {
                      try { console.log('Validation failed', errs); } catch {}
                    }) as any)();
                  }
                } catch {}
              }
            }}
          >
            {isSubmitting ? 'Отправка...' : `Отправить в ${planner}`}
          </button>
        </div>
      </form>
    </div>
  );
};
