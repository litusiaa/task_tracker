import axios from 'axios';
import { FormData, ApiResponse } from '../types';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const submitForm = async (formData: FormData): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>('/submit', formData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data: any = error.response?.data;
      const raw = data?.error ?? data?.message ?? error.message;
      const msg = typeof raw === 'string' ? raw : (raw?.message || JSON.stringify(raw));
      return {
        success: false,
        error: msg || 'Произошла ошибка при отправке формы',
      };
    }
    return {
      success: false,
      error: 'Неизвестная ошибка',
    };
  }
};
