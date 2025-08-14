import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File;
  error?: boolean;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFile,
  error = false,
  disabled = false,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
      error ? 'border-error-500 bg-error-50' : 'border-gray-300 hover:border-gray-400'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id="file-upload"
        accept=".pdf,.doc,.docx,.txt"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {selectedFile ? (
            <>
              Выбран файл: <span className="font-medium">{selectedFile.name}</span>
            </>
          ) : (
            'Нажмите для выбора файла или перетащите сюда'
          )}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Поддерживаемые форматы: PDF, DOC, DOCX, TXT
        </p>
      </label>
    </div>
  );
};
