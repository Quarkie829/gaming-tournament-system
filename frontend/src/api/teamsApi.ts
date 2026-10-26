import apiClient from './client';
import { Team, TeamMember } from '../types';

export const teamsApi = {
  listTeams: async (params?: { mine?: boolean; search?: string }): Promise<{ success: boolean; count: number; teams: Team[] }> => {
    const res = await apiClient.get('/teams', { params });
    return res.data;
  },

  getTeam: async (id: number): Promise<{
    success: boolean;
    team: Team;
    members: TeamMember[];
    registrations: any[];
    user_permissions: {
      is_captain: boolean;
      is_member: boolean;
      can_manage: boolean;
    };
  }> => {
    const res = await apiClient.get(`/teams/${id}`);
    return res.data;
  },

  createTeam: async (team_name: string): Promise<{ success: boolean; team_id: number; team_name: string }> => {
    const res = await apiClient.post('/teams', { team_name });
    return res.data;
  },

  addMember: async (teamId: number, data: { user_id?: number; username?: string; member_role?: string }): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post(`/teams/${teamId}/members`, data);
    return res.data;
  },

  removeMember: async (teamId: number, userId: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/teams/${teamId}/members/${userId}`);
    return res.data;
  },

  updateMemberRole: async (teamId: number, userId: number, member_role: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put(`/teams/${teamId}/members/${userId}`, { member_role });
    return res.data;
  },

  deleteTeam: async (teamId: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/teams/${teamId}`);
    return res.data;
  }
};
