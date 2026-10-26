import apiClient from './client';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

export const authApi = {
  login: async (credentials: { login: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },

  register: async (userData: { username: string; email: string; password: string; country?: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', userData);
    return res.data;
  },

  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getUserProfile: async (id: number): Promise<any> => {
    const res = await apiClient.get(`/users/${id}`);
    return res.data;
  },

  updateUserProfile: async (id: number, data: any): Promise<any> => {
    const res = await apiClient.put(`/users/${id}`, data);
    return res.data;
  },

  searchUsers: async (search?: string): Promise<{ success: boolean; users: User[] }> => {
    const res = await apiClient.get('/users', { params: { search } });
    return res.data;
  }
};
