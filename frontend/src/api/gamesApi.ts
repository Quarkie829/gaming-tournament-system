import apiClient from './client';
import { Game } from '../types';

export const gamesApi = {
  listGames: async (search?: string): Promise<{ success: boolean; count: number; games: Game[] }> => {
    const res = await apiClient.get('/games', { params: { search } });
    return res.data;
  },

  getGame: async (id: number): Promise<{ success: boolean; game: Game; tournaments: any[] }> => {
    const res = await apiClient.get(`/games/${id}`);
    return res.data;
  },

  createGame: async (data: Omit<Game, 'game_id'>): Promise<{ success: boolean; game: Game }> => {
    const res = await apiClient.post('/games', data);
    return res.data;
  },

  updateGame: async (id: number, data: Partial<Game>): Promise<{ success: boolean; game: Game }> => {
    const res = await apiClient.put(`/games/${id}`, data);
    return res.data;
  },

  deleteGame: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/games/${id}`);
    return res.data;
  }
};
