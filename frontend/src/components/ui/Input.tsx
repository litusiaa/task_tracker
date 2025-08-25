import React from 'react';

interface InputProps {
  type?: 'text' | 'url' | 'date' | 'datetime-local';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  min?: string;
  step?: number;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  error = false,
  disabled = false,
  min,
  step,
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      step={step}
      className={`form-input ${error ? 'form-input-error' : ''} ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      }`}
    />
  );
};
