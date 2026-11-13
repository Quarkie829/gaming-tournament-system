import apiClient from './client';
import { Payment, Prize, Sponsor, TournamentSponsor } from '../types';

export const financialApi = {
  // Payments
  listPayments: async (params?: {
    tournament_id?: number;
    payment_status?: string;
  }): Promise<{ success: boolean; count: number; payments: Payment[] }> => {
    const res = await apiClient.get('/payments', { params });
    return res.data;
  },

  createPayment: async (data: {
    registration_id: number;
    amount: number;
    payment_method: string;
    transaction_reference?: string;
  }): Promise<{ success: boolean; message: string; payment_id: number; transaction_reference: string }> => {
    const res = await apiClient.post('/payments', data);
    return res.data;
  },

  updatePaymentStatus: async (
    paymentId: number,
    payment_status: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.patch(`/payments/${paymentId}/status`, { payment_status });
    return res.data;
  },

  // Prizes
  listPrizes: async (params?: {
    tournament_id?: number;
  }): Promise<{ success: boolean; count: number; prizes: Prize[] }> => {
    const res = await apiClient.get('/prizes', { params });
    return res.data;
  },

  createPrize: async (data: {
    tournament_id: number;
    placement: number;
    prize_amount: number;
    description?: string;
  }): Promise<{ success: boolean; message: string; prize_id: number }> => {
    const res = await apiClient.post('/prizes', data);
    return res.data;
  },

  updatePrize: async (
    prizeId: number,
    data: { placement: number; prize_amount: number; description?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put(`/prizes/${prizeId}`, data);
    return res.data;
  },

  awardPrize: async (
    prizeId: number,
    awarded_registration_id: number | null
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.patch(`/prizes/${prizeId}/award`, { awarded_registration_id });
    return res.data;
  },

  deletePrize: async (prizeId: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/prizes/${prizeId}`);
    return res.data;
  },

  // Sponsors
  listSponsors: async (): Promise<{ success: boolean; count: number; sponsors: Sponsor[] }> => {
    const res = await apiClient.get('/sponsors');
    return res.data;
  },

  createSponsor: async (data: {
    sponsor_name: string;
    contact_email?: string;
    country?: string;
  }): Promise<{ success: boolean; message: string; sponsor_id: number }> => {
    const res = await apiClient.post('/sponsors', data);
    return res.data;
  },

  updateSponsor: async (
    sponsorId: number,
    data: { sponsor_name: string; contact_email?: string; country?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put(`/sponsors/${sponsorId}`, data);
    return res.data;
  },

  deleteSponsor: async (sponsorId: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/sponsors/${sponsorId}`);
    return res.data;
  },

  // Tournament Sponsors
  listTournamentSponsors: async (
    tournamentId: number
  ): Promise<{ success: boolean; count: number; sponsors: TournamentSponsor[] }> => {
    const res = await apiClient.get(`/tournaments/${tournamentId}/sponsors`);
    return res.data;
  },

  addTournamentSponsor: async (
    tournamentId: number,
    data: { sponsor_id: number; contribution_amount: number; sponsored_on?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post(`/tournaments/${tournamentId}/sponsors`, data);
    return res.data;
  },

  removeTournamentSponsor: async (
    tournamentId: number,
    sponsorId: number
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/tournaments/${tournamentId}/sponsors/${sponsorId}`);
    return res.data;
  }
};
