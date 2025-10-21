import api from './api';
import { LoginCredentials, RegisterData, User, ApiResponse } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/api/auth/login', credentials);
    return response.data.data!;
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/api/auth/register', data);
    return response.data.data!;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/api/user/profile');
    return response.data.data!;
  },
};
