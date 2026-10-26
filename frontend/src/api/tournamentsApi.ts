import apiClient from './client';
import { Tournament, UserEligibility } from '../types';

export const tournamentsApi = {
  listTournaments: async (params?: {
    game_id?: number;
    status?: string;
    participation_type?: string;
    search?: string;
  }): Promise<{ success: boolean; count: number; tournaments: Tournament[] }> => {
    const res = await apiClient.get('/tournaments', { params });
    return res.data;
  },

  getTournament: async (id: number): Promise<{
    success: boolean;
    tournament: Tournament;
    registrations: any[];
    user_eligibility: UserEligibility | null;
  }> => {
    const res = await apiClient.get(`/tournaments/${id}`);
    return res.data;
  },

  createTournament: async (data: any): Promise<{ success: boolean; tournament_id: number }> => {
    const res = await apiClient.post('/tournaments', data);
    return res.data;
  },

  updateTournament: async (id: number, data: any): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put(`/tournaments/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.patch(`/tournaments/${id}/status`, { status });
    return res.data;
  },

  deleteTournament: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/tournaments/${id}`);
    return res.data;
  },

  getStats: async (): Promise<{ success: boolean; metrics: any; registration_breakdown: any[] }> => {
    const res = await apiClient.get('/tournaments/stats');
    return res.data;
  }
};
