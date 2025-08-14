import React from 'react';

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: boolean;
  disabled?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  error = false,
  disabled = false,
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`form-input ${error ? 'form-input-error' : ''} ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      }`}
    />
  );
};
