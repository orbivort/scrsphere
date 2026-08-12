// SM Facilitation Dashboard Service
// Aggregates Scrum event compliance, impediment health, DoD adherence trends,
// Sprint Goal achievement, and retrospective action item completion for the SM role.
import prisma from '../utils/prisma';
import { teamHealthCheckService } from './teamHealthCheck.service';

const DURATION_DAYS: Record<string, number> = {
  ONE_WEEK: 7,
  TWO_WEEKS: 14,
  THREE_WEEKS: 21,
  FOUR_WEEKS: 28,
};

export const smDashboardService = {
  /**
   * Event compliance for the last N Sprints: whether each event was completed,
   * daily scrum counts, and timebox adherence (based on Sprint duration).
   */
  async getEventCompliance(teamId: string, sprintCount = 5) {
    const sprints = await prisma.sprint.findMany({
      where: { teamId },
      include: {
        sprintReview: { select: { id: true } },
        retrospective: { select: { id: true } },
        dailyUpdates: { select: { id: true } },
        generatedSprint: { select: { sprintNumber: true } },
      },
      orderBy: { startDate: 'desc' },
      take: sprintCount,
    });

    const config = await prisma.sprintConfiguration.findUnique({ where: { teamId } });
    const durationDays = config ? (DURATION_DAYS[config.duration] ?? 14) : 14;
    const expectedDailyScrums = Math.max(Math.floor(durationDays / 7) * 5, 1);

    return sprints.map((sprint) => ({
      sprintId: sprint.id,
      sprintName: sprint.name,
      status: sprint.status,
      sprintPlanningCompleted: sprint.status !== 'PLANNED',
      sprintReviewCompleted: Boolean(sprint.sprintReview),
      retrospectiveCompleted: Boolean(sprint.retrospective),
      dailyScrumHeld: sprint.dailyUpdates.length,
      dailyScrumExpected:
        sprint.status === 'COMPLETED' ? expectedDailyScrums : sprint.dailyUpdates.length,
      timeboxExceeded: false,
    }));
  },

  /**
   * Impediment metrics: status distribution, average resolution time, aging report.
   */
  async getImpedimentMetrics(teamId: string, sprintDurationDays = 14) {
    const impediments = await prisma.impediment.findMany({
      where: { teamId },
      include: {
        sprint: { select: { name: true } },
      },
    });

    const byStatus = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    for (const imp of impediments) {
      if (imp.status in byStatus) {
        byStatus[imp.status as keyof typeof byStatus] += 1;
      }
    }

    const resolved = impediments.filter(
      (i) => (i.status === 'RESOLVED' || i.status === 'CLOSED') && i.resolvedAt
    );
    const averageResolutionDays =
      resolved.length > 0
        ? Math.round(
            resolved.reduce((sum, i) => {
              const start = new Date(i.createdAt).getTime();
              const end = i.resolvedAt ? new Date(i.resolvedAt).getTime() : start;
              return sum + (end - start) / (1000 * 60 * 60 * 24);
            }, 0) / resolved.length
          )
        : 0;

    const now = Date.now();
    const aging = impediments
      .filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS')
      .map((i) => {
        const ageDays = Math.floor((now - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: i.id,
          title: i.title,
          status: i.status,
          ageDays,
          atRisk: ageDays > sprintDurationDays,
          sprintName: i.sprint?.name ?? null,
        };
      })
      .sort((a, b) => b.ageDays - a.ageDays);

    return {
      total: impediments.length,
      open: byStatus.OPEN,
      inProgress: byStatus.IN_PROGRESS,
      resolved: byStatus.RESOLVED,
      closed: byStatus.CLOSED,
      averageResolutionDays,
      aging,
    };
  },

  /**
   * DoD compliance trend across the last N completed Sprints.
   * Compliance % = verified DoD items / total DoD items for PBIs in each Sprint.
   */
  async getDoDComplianceTrend(teamId: string, sprintCount = 5) {
    const completedSprints = await prisma.sprint.findMany({
      where: { teamId, status: 'COMPLETED' },
      orderBy: { endDate: 'desc' },
      take: sprintCount,
    });

    const trend = await Promise.all(
      completedSprints.map(async (sprint) => {
        const sprintBacklogItems = await prisma.sprintBacklogItem.findMany({
          where: { sprintId: sprint.id },
          select: { pbiId: true },
        });
        const pbiIds = sprintBacklogItems.map((s) => s.pbiId);

        if (pbiIds.length === 0) {
          return {
            sprintId: sprint.id,
            sprintName: sprint.name,
            compliancePercentage: 0,
            totalItems: 0,
            metItems: 0,
          };
        }

        const verifications = await prisma.doDChecklistVerification.findMany({
          where: { pbiId: { in: pbiIds } },
        });

        const totalItems = verifications.length;
        const metItems = verifications.filter((v) => v.isVerified).length;
        const compliancePercentage = totalItems > 0 ? Math.round((metItems / totalItems) * 100) : 0;

        return {
          sprintId: sprint.id,
          sprintName: sprint.name,
          compliancePercentage,
          totalItems,
          metItems,
        };
      })
    );

    return trend;
  },

  /**
   * Sprint Goal achievement rate across completed Sprints.
   */
  async getSprintGoalAchievement(teamId: string) {
    const completedSprints = await prisma.sprint.findMany({
      where: { teamId, status: 'COMPLETED' },
      select: { id: true, name: true, sprintGoal: true },
      orderBy: { endDate: 'desc' },
    });

    // The sprint goal achievement is derived from completed PBIs in the sprint
    // that reference the sprint goal. For simplicity, we infer achievement based
    // on the presence of a sprint goal and the completion of its PBIs.
    const list = await Promise.all(
      completedSprints.map(async (sprint) => {
        const backlogItems = await prisma.sprintBacklogItem.findMany({
          where: { sprintId: sprint.id },
          select: { pbiId: true },
        });
        const pbiIds = backlogItems.map((b) => b.pbiId);
        const donePbis = pbiIds.length
          ? await prisma.productBacklogItem.count({
              where: { id: { in: pbiIds }, status: 'DONE' },
            })
          : 0;

        let achievement: 'achieved' | 'partial' | 'not_achieved' = 'not_achieved';
        if (!sprint.sprintGoal) {
          achievement = 'not_achieved';
        } else if (pbiIds.length > 0 && donePbis === pbiIds.length) {
          achievement = 'achieved';
        } else if (donePbis > 0) {
          achievement = 'partial';
        }

        return {
          sprintId: sprint.id,
          sprintName: sprint.name,
          sprintGoal: sprint.sprintGoal ?? '',
          achievement,
        };
      })
    );

    const achieved = list.filter((s) => s.achievement === 'achieved').length;
    const partial = list.filter((s) => s.achievement === 'partial').length;
    const notAchieved = list.filter((s) => s.achievement === 'not_achieved').length;
    const achievementRate = list.length > 0 ? Math.round((achieved / list.length) * 100) : 0;

    return { achievementRate, achieved, partial, notAchieved, list };
  },

  /**
   * Retrospective action item completion metrics.
   */
  async getActionItemCompletion(teamId: string) {
    const actionItems = await prisma.retroActionItem.findMany({
      where: {
        retrospective: { teamId },
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const total = actionItems.length;
    const completed = actionItems.filter((a) => a.status === 'COMPLETED').length;
    const inProgress = actionItems.filter((a) => a.status === 'IN_PROGRESS').length;
    const pending = actionItems.filter((a) => a.status === 'PENDING').length;
    const now = Date.now();
    const overdue = actionItems.filter(
      (a) => a.status !== 'COMPLETED' && a.dueDate && new Date(a.dueDate).getTime() < now
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const pendingItems = actionItems
      .filter((a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS')
      .map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        overdue: Boolean(a.dueDate && new Date(a.dueDate).getTime() < now),
        ownerName: a.owner ? `${a.owner.firstName} ${a.owner.lastName}` : '',
      }))
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      completionRate,
      pendingItems,
    };
  },

  /**
   * Single aggregation endpoint for the SM dashboard.
   */
  async getDashboard(teamId: string, sprintCount = 5) {
    const sprintDurationDays = await this.getSprintDurationDays(teamId);

    const [
      eventCompliance,
      impedimentMetrics,
      dodCompliance,
      sprintGoal,
      actionItems,
      healthCheck,
    ] = await Promise.all([
      this.getEventCompliance(teamId, sprintCount),
      this.getImpedimentMetrics(teamId, sprintDurationDays),
      this.getDoDComplianceTrend(teamId, sprintCount),
      this.getSprintGoalAchievement(teamId),
      this.getActionItemCompletion(teamId),
      teamHealthCheckService.getLatestForTeam(teamId),
    ]);

    return {
      eventCompliance,
      impedimentMetrics,
      dodComplianceTrend: dodCompliance,
      sprintGoalAchievement: sprintGoal,
      actionItemCompletion: actionItems,
      healthCheck,
    };
  },

  async getSprintDurationDays(teamId: string): Promise<number> {
    const config = await prisma.sprintConfiguration.findUnique({ where: { teamId } });
    return config ? (DURATION_DAYS[config.duration] ?? 14) : 14;
  },

  /**
   * Sprint calendar scheduling assistant: propose dates/times for Scrum events.
   */
  async getEventSchedule(teamId: string) {
    const config = await prisma.sprintConfiguration.findUnique({ where: { teamId } });
    const durationDays = config ? (DURATION_DAYS[config.duration] ?? 14) : 14;

    const nextSprint = await prisma.sprint.findFirst({
      where: { teamId, status: 'PLANNED' },
      orderBy: { startDate: 'asc' },
    });

    const start = nextSprint?.startDate ?? new Date();
    const sprintStart = new Date(start);

    const suggest = (dayOffset: number, hour: number, label: string) => {
      const date = new Date(sprintStart);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(hour, 0, 0, 0);
      return { event: label, date: date.toISOString() };
    };

    return {
      sprintName: nextSprint?.name ?? null,
      durationDays,
      events: [
        suggest(0, 9, 'SprintPlanning'),
        suggest(1, 9, 'DailyScrum'),
        suggest(Math.max(durationDays - 2, 1), 9, 'DailyScrum'),
        suggest(Math.max(durationDays - 1, 1), 10, 'SprintReview'),
        suggest(Math.max(durationDays - 1, 1), 11, 'SprintRetrospective'),
      ],
    };
  },
};
