// Sprint Review Service
import type {
  SprintReview,
  StakeholderFeedback,
  BacklogAdjustment,
  ReviewAttendee,
  ApiResponse,
} from '../../types';
import { coreApiService } from '../core/api.core';
import { logger } from '../../utils/logger';

class SprintReviewService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getSprintReviews(teamId: string, sprintId?: string): Promise<ApiResponse<SprintReview[]>> {
    const params: { teamId: string; sprintId?: string } = { teamId };
    if (sprintId) params.sprintId = sprintId;
    const { data } = await this.api.get('/sprint-reviews', { params });
    return data;
  }

  async getSprintReview(id: string): Promise<ApiResponse<SprintReview>> {
    const { data } = await this.api.get(`/sprint-reviews/${id}`);
    return data;
  }

  async createSprintReview(review: Partial<SprintReview>): Promise<ApiResponse<SprintReview>> {
    const { data } = await this.api.post('/sprint-reviews', review);
    return data;
  }

  async updateSprintReview(
    id: string,
    updates: Partial<SprintReview>
  ): Promise<ApiResponse<SprintReview>> {
    logger.debug('[API] updateSprintReview called', undefined, {
      id,
      updates,
      endpoint: `/sprint-reviews/${id}`,
    });
    try {
      const { data } = await this.api.put(`/sprint-reviews/${id}`, updates);
      logger.debug('[API] updateSprintReview success', undefined, { id, data });
      return data;
    } catch (error) {
      logger.error('[API] updateSprintReview failed', undefined, {
        id,
        updates,
        error,
        axiosError: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async addStakeholderFeedback(
    reviewId: string,
    feedback: Partial<StakeholderFeedback>
  ): Promise<ApiResponse<StakeholderFeedback>> {
    const { data } = await this.api.post(`/sprint-reviews/${reviewId}/feedback`, feedback);
    return data;
  }

  async getPendingAdjustments(teamId: string): Promise<ApiResponse<BacklogAdjustment[]>> {
    const { data } = await this.api.get('/sprint-reviews/adjustments/pending', {
      params: { teamId },
    });
    return data;
  }

  async markAdjustmentImplemented(adjustmentId: string): Promise<ApiResponse<BacklogAdjustment>> {
    const { data } = await this.api.put(`/sprint-reviews/adjustments/${adjustmentId}/implement`);
    return data;
  }

  async getPendingFeedback(teamId: string): Promise<ApiResponse<StakeholderFeedback[]>> {
    const { data } = await this.api.get('/sprint-reviews/feedback/pending', {
      params: { teamId },
    });
    return data;
  }

  async markFeedbackAddressed(feedbackId: string): Promise<ApiResponse<StakeholderFeedback>> {
    const { data } = await this.api.put(`/sprint-reviews/feedback/${feedbackId}/address`);
    return data;
  }

  async addAttendee(
    reviewId: string,
    attendeeData: { name: string; email?: string; role: string; attended: boolean }
  ): Promise<ApiResponse<ReviewAttendee>> {
    const { data } = await this.api.post(`/sprint-reviews/${reviewId}/attendees`, attendeeData);
    return data;
  }

  async updateAttendee(
    attendeeId: string,
    attendeeData: { name?: string; email?: string; role?: string; attended?: boolean }
  ): Promise<ApiResponse<ReviewAttendee>> {
    const { data } = await this.api.put(`/sprint-reviews/attendees/${attendeeId}`, attendeeData);
    return data;
  }

  async deleteAttendee(attendeeId: string): Promise<ApiResponse<{ message: string }>> {
    const { data } = await this.api.delete(`/sprint-reviews/attendees/${attendeeId}`);
    return data;
  }
}

export const sprintReviewService = new SprintReviewService();
