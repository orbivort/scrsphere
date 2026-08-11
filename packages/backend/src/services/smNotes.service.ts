// SM Notes Service
// Simple annotations stored on Scrum event models (Sprint, SprintReview, SprintRetrospective).
import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export const smNotesService = {
  async updateSprintNotes(id: string, smNotes: string, userId: string | undefined) {
    const existing = await prisma.sprint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Sprint');
    }
    return prisma.sprint.update({
      where: { id },
      data: { smNotes, updatedBy: userId, updatedAt: new Date() },
      select: { id: true, smNotes: true },
    });
  },

  async updateSprintReviewNotes(id: string, smNotes: string, userId: string | undefined) {
    const existing = await prisma.sprintReview.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Sprint Review');
    }
    return prisma.sprintReview.update({
      where: { id },
      data: { smNotes, updatedBy: userId, updatedAt: new Date() },
      select: { id: true, smNotes: true },
    });
  },

  async updateRetrospectiveNotes(id: string, smNotes: string, userId: string | undefined) {
    const existing = await prisma.sprintRetrospective.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Sprint Retrospective');
    }
    return prisma.sprintRetrospective.update({
      where: { id },
      data: { smNotes, updatedBy: userId, updatedAt: new Date() },
      select: { id: true, smNotes: true },
    });
  },
};
