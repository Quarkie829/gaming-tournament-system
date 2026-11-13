import apiClient from './client';
import { Match, MatchDispute, ResultCorrection } from '../types';

export const matchesApi = {
  listMatches: async (params?: {
    tournament_id?: number;
    round_name?: string;
    status?: string;
  }): Promise<{ success: boolean; count: number; matches: Match[] }> => {
    const res = await apiClient.get('/matches', { params });
    return res.data;
  },

  getMatch: async (id: number): Promise<{
    success: boolean;
    match: Match;
    disputes: MatchDispute[];
    corrections: ResultCorrection[];
    user_participant: {
      is_participant: boolean;
      registration_id: number | null;
    };
  }> => {
    const res = await apiClient.get(`/matches/${id}`);
    return res.data;
  },

  createMatch: async (data: {
    tournament_id: number;
    round_name: string;
    match_number: number;
    scheduled_time: string;
    status?: string;
  }): Promise<{ success: boolean; match_id: number; message: string }> => {
    const res = await apiClient.post('/matches', data);
    return res.data;
  },

  updateMatch: async (id: number, data: any): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put(`/matches/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.patch(`/matches/${id}/status`, { status });
    return res.data;
  },

  deleteMatch: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/matches/${id}`);
    return res.data;
  },

  addParticipant: async (
    matchId: number,
    data: { registration_id: number; slot_number: number }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post(`/matches/${matchId}/participants`, data);
    return res.data;
  },

  removeParticipant: async (
    matchId: number,
    registrationId: number
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/matches/${matchId}/participants/${registrationId}`);
    return res.data;
  },

  recordResults: async (
    matchId: number,
    data: {
      results: Array<{ registration_id: number; score: number; outcome: string }>;
      mark_completed?: boolean;
    }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post(`/matches/${matchId}/results`, data);
    return res.data;
  },

  raiseDispute: async (
    matchId: number,
    data: { reason: string; registration_id?: number }
  ): Promise<{ success: boolean; message: string; dispute_id: number }> => {
    const res = await apiClient.post(`/matches/${matchId}/disputes`, data);
    return res.data;
  },

  listDisputes: async (params?: {
    tournament_id?: number;
    status?: string;
  }): Promise<{ success: boolean; count: number; disputes: MatchDispute[] }> => {
    const res = await apiClient.get('/matches/disputes', { params });
    return res.data;
  },

  updateDisputeStatus: async (
    disputeId: number,
    status: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.patch(`/matches/disputes/${disputeId}`, { status });
    return res.data;
  },

  correctResult: async (
    matchId: number,
    data: {
      registration_id: number;
      new_score: number;
      dispute_id?: number | null;
    }
  ): Promise<{ success: boolean; message: string; correction_id: number }> => {
    const res = await apiClient.post(`/matches/${matchId}/corrections`, data);
    return res.data;
  },

  getMatchCorrections: async (
    matchId: number
  ): Promise<{ success: boolean; count: number; corrections: ResultCorrection[] }> => {
    const res = await apiClient.get(`/matches/${matchId}/corrections`);
    return res.data;
  }
};
