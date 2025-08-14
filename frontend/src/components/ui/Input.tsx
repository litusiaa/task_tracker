import React from 'react';

interface InputProps {
  type?: 'text' | 'url' | 'date';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  error = false,
  disabled = false,
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`form-input ${error ? 'form-input-error' : ''} ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      }`}
    />
  );
};
