// Team Service
import type { Team, TeamMember, ApiResponse } from '../../types';
import { coreApiService } from '../core/api.core';

class TeamService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getTeams(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<
    ApiResponse<{
      teams: Team[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > {
    const { data } = await this.api.get('/teams', { params });
    return data;
  }

  async getTeam(id: string): Promise<ApiResponse<Team>> {
    const { data } = await this.api.get(`/teams/${id}`);
    return data;
  }

  async createTeam(teamData: Partial<Team>): Promise<ApiResponse<Team>> {
    const { data } = await this.api.post('/teams', teamData);
    return data;
  }

  async updateTeam(id: string, teamData: Partial<Team>): Promise<ApiResponse<Team>> {
    const { data } = await this.api.put(`/teams/${id}`, teamData);
    return data;
  }

  async deleteTeam(id: string): Promise<ApiResponse<null>> {
    const { data } = await this.api.delete(`/teams/${id}`);
    return data;
  }

  async addTeamMember(
    teamId: string,
    email: string,
    role: string
  ): Promise<ApiResponse<TeamMember>> {
    const upperRole = role.toUpperCase();
    const { data } = await this.api.post(`/teams/${teamId}/members`, {
      email,
      role: upperRole,
    });
    return data;
  }

  async removeTeamMember(teamId: string, memberId: string): Promise<ApiResponse<null>> {
    const { data } = await this.api.delete(`/teams/${teamId}/members/${memberId}`);
    return data;
  }

  async updateTeamMemberRole(
    teamId: string,
    memberId: string,
    role: string
  ): Promise<ApiResponse<TeamMember>> {
    const { data } = await this.api.put(`/teams/${teamId}/members/${memberId}`, { role });
    return data;
  }

  async getMyTeams(): Promise<ApiResponse<(Team & { userRole: string })[]>> {
    const { data } = await this.api.get('/teams/my-teams');
    return data;
  }

  async getMyRoleInTeam(teamId: string): Promise<ApiResponse<{ role: string }>> {
    const { data } = await this.api.get(`/teams/${teamId}/my-role`);
    return data;
  }

  async selectTeam(teamId: string): Promise<ApiResponse<Team & { userRole: string }>> {
    const { data } = await this.api.post('/teams/select-team', { teamId });
    return data;
  }
}

export const teamService = new TeamService();
