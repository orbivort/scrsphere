// Timebox Service
import type { ScrumEvent, TimeboxState } from '@scrumooth/shared';

import type { ApiResponse } from '../../types';
import { coreApiService } from '../core/api.core';

export interface TimeboxQuery {
  /** The active team ID. Required so the backend can scope (and authorize) the timebox. */
  teamId?: string;
  sprintId?: string;
  date?: string;
}

class TimeboxService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getTimebox(
    eventType: ScrumEvent,
    query: TimeboxQuery = {}
  ): Promise<ApiResponse<TimeboxState>> {
    const { data } = await this.api.get(`/timeboxes/${eventType}`, {
      params: query,
    });
    return data;
  }

  async startTimebox(
    eventType: ScrumEvent,
    body: TimeboxQuery = {}
  ): Promise<ApiResponse<TimeboxState>> {
    const { data } = await this.api.post(`/timeboxes/${eventType}/start`, body);
    return data;
  }

  async pauseTimebox(
    eventType: ScrumEvent,
    body: TimeboxQuery = {}
  ): Promise<ApiResponse<TimeboxState>> {
    const { data } = await this.api.post(`/timeboxes/${eventType}/pause`, body);
    return data;
  }

  async resetTimebox(
    eventType: ScrumEvent,
    body: TimeboxQuery = {}
  ): Promise<ApiResponse<TimeboxState>> {
    const { data } = await this.api.post(`/timeboxes/${eventType}/reset`, body);
    return data;
  }

  async concludeTimebox(
    eventType: ScrumEvent,
    body: TimeboxQuery = {}
  ): Promise<ApiResponse<TimeboxState>> {
    const { data } = await this.api.post(`/timeboxes/${eventType}/conclude`, body);
    return data;
  }
}

export const timeboxService = new TimeboxService();
