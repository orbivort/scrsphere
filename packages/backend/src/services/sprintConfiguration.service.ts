import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import type {
  SprintConfiguration,
  GeneratedSprint,
  SprintDuration,
  SprintStatus,
} from '../generated/prisma/client';

export interface CreateSprintConfigData {
  teamId: string;
  duration: SprintDuration;
  year: number;
  sprintStartDay?: number;
}

export interface UpdateSprintConfigData {
  duration?: SprintDuration;
  year?: number;
  sprintStartDay?: number;
}

export interface GenerateSprintsData {
  teamId: string;
  duration: SprintDuration;
  year: number;
}

export interface SprintGenerationResult {
  success: boolean;
  generatedCount: number;
  sprints: GeneratedSprint[];
  message?: string;
}

class SprintConfigurationService {
  async getSprintConfiguration(teamId: string): Promise<SprintConfiguration | null> {
    const config = await prisma.sprintConfiguration.findUnique({
      where: { teamId },
    });
    return config;
  }

  async createSprintConfiguration(
    userId: string,
    data: CreateSprintConfigData
  ): Promise<SprintConfiguration> {
    const existingConfig = await prisma.sprintConfiguration.findUnique({
      where: { teamId: data.teamId },
    });

    if (existingConfig) {
      throw new BadRequestError('Sprint configuration already exists for this team');
    }

    const configId = generateUUIDv7();

    const config = await prisma.sprintConfiguration.create({
      data: {
        id: configId,
        teamId: data.teamId,
        duration: data.duration,
        year: data.year,
        sprintStartDay: data.sprintStartDay ?? 1,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return config;
  }

  async updateSprintConfiguration(
    id: string,
    userId: string,
    data: UpdateSprintConfigData
  ): Promise<SprintConfiguration> {
    const existingConfig = await prisma.sprintConfiguration.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new NotFoundError('Sprint configuration');
    }

    const config = await prisma.sprintConfiguration.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    return config;
  }

  async generateSprintsForYear(
    userId: string,
    data: GenerateSprintsData
  ): Promise<SprintGenerationResult> {
    const { teamId, duration, year } = data;

    await prisma.generatedSprint.deleteMany({
      where: { teamId, year },
    });

    const sprints: GeneratedSprint[] = [];
    const shortYear = year.toString().slice(-2);
    const weekDuration = duration === 'TWO_WEEKS' ? 14 : 28;
    const durationStr = duration === 'TWO_WEEKS' ? '2w' : '4w';

    const currentDate = new Date(year, 0, 1);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 1) {
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      currentDate.setDate(currentDate.getDate() + daysUntilMonday);
    }

    let sprintNumber = 1;

    while (currentDate.getFullYear() <= year) {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + weekDuration - 3);

      if (startDate.getFullYear() > year) break;

      const formattedSprintNum = sprintNumber.toString().padStart(2, '0');
      const formatDateSimple = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}/${m}/${day}`;
      };
      const dateRange = `${formatDateSimple(startDate)}-${formatDateSimple(endDate)}`;
      const name = `Sprint-${durationStr}-${shortYear}${formattedSprintNum} (${dateRange})`;

      const sprintId = generateUUIDv7();

      const sprint = await prisma.generatedSprint.create({
        data: {
          id: sprintId,
          teamId,
          name,
          sprintNumber,
          year,
          startDate,
          endDate,
          status: 'PLANNED' as SprintStatus,
          createdBy: userId,
        },
      });

      sprints.push(sprint);

      currentDate.setDate(currentDate.getDate() + weekDuration);
      sprintNumber++;
    }

    return {
      success: true,
      generatedCount: sprints.length,
      sprints,
      message: `Successfully generated ${sprints.length} sprints for ${year}`,
    };
  }

  async getGeneratedSprints(teamId: string, year?: number): Promise<GeneratedSprint[]> {
    const where: { teamId: string; year?: number } = { teamId };
    if (year) {
      where.year = year;
    }

    const sprints = await prisma.generatedSprint.findMany({
      where,
      orderBy: { sprintNumber: 'asc' },
    });

    return sprints;
  }

  async deleteGeneratedSprint(sprintId: string): Promise<void> {
    const sprint = await prisma.generatedSprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new NotFoundError('Generated sprint');
    }

    if (sprint.status === 'ACTIVE') {
      throw new BadRequestError('Cannot delete an active sprint');
    }

    await prisma.generatedSprint.delete({
      where: { id: sprintId },
    });
  }

  async updateGeneratedSprint(
    sprintId: string,
    userId: string,
    updates: { sprintGoal?: string }
  ): Promise<GeneratedSprint> {
    const sprint = await prisma.generatedSprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new NotFoundError('Generated sprint');
    }

    const updatedSprint = await prisma.generatedSprint.update({
      where: { id: sprintId },
      data: {
        ...updates,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    return updatedSprint;
  }
}

export const sprintConfigurationService = new SprintConfigurationService();
export default sprintConfigurationService;
