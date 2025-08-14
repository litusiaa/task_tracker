import axios from 'axios';
import { FormData, ApiResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
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
      return {
        success: false,
        error: error.response?.data?.error || 'Произошла ошибка при отправке формы',
      };
    }
    return {
      success: false,
      error: 'Неизвестная ошибка',
    };
  }
};
