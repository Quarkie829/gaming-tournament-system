import apiClient from './client';
import { Registration } from '../types';

export const registrationsApi = {
  registerSolo: async (
    tournament_id: number,
    payment?: { payment_method: string; transaction_reference?: string }
  ): Promise<{ success: boolean; message: string; registration_id: number }> => {
    const res = await apiClient.post('/registrations/solo', {
      tournament_id,
      payment_method: payment?.payment_method,
      transaction_reference: payment?.transaction_reference
    });
    return res.data;
  },

  registerTeam: async (
    tournament_id: number,
    team_id: number,
    payment?: { payment_method: string; transaction_reference?: string }
  ): Promise<{ success: boolean; message: string; registration_id: number }> => {
    const res = await apiClient.post('/registrations/team', {
      tournament_id,
      team_id,
      payment_method: payment?.payment_method,
      transaction_reference: payment?.transaction_reference
    });
    return res.data;
  },

  getMyRegistrations: async (): Promise<{ success: boolean; count: number; registrations: Registration[] }> => {
    const res = await apiClient.get('/registrations/my');
    return res.data;
  },

  listAllRegistrations: async (params?: {
    tournament_id?: number;
    status?: string;
    type?: 'Solo' | 'Team';
  }): Promise<{ success: boolean; count: number; registrations: Registration[] }> => {
    const res = await apiClient.get('/registrations', { params });
    return res.data;
  },

  listRegistrations: async (params?: {
    tournament_id?: number;
    status?: string;
    type?: 'Solo' | 'Team';
  }): Promise<{ success: boolean; count: number; registrations: Registration[] }> => {
    const res = await apiClient.get('/registrations', { params });
    return res.data;
  },

  updateStatus: async (
    registrationId: number,
    status: string,
    options?: { waive_fee?: boolean }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.patch(`/registrations/${registrationId}/status`, { status, ...options });
    return res.data;
  },

  cancelRegistration: async (registrationId: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.patch(`/registrations/${registrationId}/cancel`);
    return res.data;
  }
};
