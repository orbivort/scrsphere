import { describe, it, expect } from 'vitest';
import { ItemStatus, TaskStatus } from '../../types';

const MOSCOW_PRIORITY_CONFIG: Record<string, { label: string; shortLabel: string }> = {
  MUST_HAVE: { label: 'Must Have', shortLabel: 'Must' },
  SHOULD_HAVE: { label: 'Should Have', shortLabel: 'Should' },
  COULD_HAVE: { label: 'Could Have', shortLabel: 'Could' },
  WONT_HAVE: { label: "Won't Have", shortLabel: "Won't" },
};

type SprintTimeCategory = 'current' | 'future' | 'past';

interface SprintWithCategory {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  category: SprintTimeCategory;
  sprintGoal?: string;
  sprintNumber?: number;
  year?: number;
}

const getSprintTimeCategory = (startDate: string, endDate: string): SprintTimeCategory => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (now >= start && now <= end) {
    return 'current';
  } else if (now < start) {
    return 'future';
  } else {
    return 'past';
  }
};

const formatSprintOptionLabel = (sprint: SprintWithCategory): string => {
  const categoryIcon =
    sprint.category === 'current' ? '🔄' : sprint.category === 'future' ? '📅' : '✓';
  const statusDisplay =
    sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1).toLowerCase();
  return `${categoryIcon} ${sprint.name} (${statusDisplay})`;
};

interface TaskGenerationConfig {
  taskCount: number;
  estimatedHours: number;
}

const STORY_POINTS_TO_TASKS: Record<number, TaskGenerationConfig> = {
  1: { taskCount: 1, estimatedHours: 2 },
  2: { taskCount: 1, estimatedHours: 4 },
  3: { taskCount: 1, estimatedHours: 8 },
  5: { taskCount: 2, estimatedHours: 8 },
  8: { taskCount: 3, estimatedHours: 8 },
  13: { taskCount: 5, estimatedHours: 8 },
};

interface SprintTask {
  id: string;
  title: string;
  pbiId: string;
  assigneeId?: string;
  assigneeName?: string;
  status: TaskStatus;
  estimatedHours?: number;
  remainingHours?: number;
}

const generateDraftTasks = (pbiId: string, pbiTitle: string, storyPoints: number): SprintTask[] => {
  const config = STORY_POINTS_TO_TASKS[storyPoints] || { taskCount: 1, estimatedHours: 8 };
  const tasks: SprintTask[] = [];

  for (let i = 0; i < config.taskCount; i++) {
    const taskTitle =
      config.taskCount === 1 ? `Plan: ${pbiTitle} - Task` : `Plan: ${pbiTitle} - Task ${i + 1}`;

    tasks.push({
      id: `task-plan-${pbiId}-${Date.now()}-${i}`,
      title: taskTitle,
      pbiId,
      status: TaskStatus.TODO,
      estimatedHours: config.estimatedHours,
      remainingHours: config.estimatedHours,
    });
  }

  return tasks;
};

const DEFAULT_READY_CHECKLIST = [
  { id: '1', label: 'Has clear acceptance criteria', checked: false },
  { id: '2', label: 'Estimated by team', checked: false },
  { id: '3', label: 'Dependencies identified', checked: false },
  { id: '4', label: 'Understandable by team', checked: false },
];

interface ReadyChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ProductBacklogItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  storyPoints?: number;
  acceptanceCriteria?: string;
}

const checkItemReadiness = (
  item: ProductBacklogItem
): { isReady: boolean; checklist: ReadyChecklistItem[] } => {
  const checklist = DEFAULT_READY_CHECKLIST.map((c) => ({ ...c }));

  if (checklist[0])
    checklist[0].checked = !!(item.acceptanceCriteria && item.acceptanceCriteria.length > 10);
  if (checklist[1]) checklist[1].checked = !!(item.storyPoints && item.storyPoints > 0);
  if (checklist[2]) checklist[2].checked = true;
  if (checklist[3]) checklist[3].checked = !!(item.description && item.description.length > 10);

  const isReady = checklist.every((c) => c.checked);
  return { isReady, checklist };
};

describe('SprintPlanning Utility Functions', () => {
  describe('getSprintTimeCategory', () => {
    it('should return "current" for sprint with current dates', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 5);

      const result = getSprintTimeCategory(
        `${startDate.toISOString().split('T')[0]}T00:00:00.000Z`,
        `${endDate.toISOString().split('T')[0]}T23:59:59.999Z`
      );
      expect(result).toBe('current');
    });

    it('should return "future" for sprint starting in the future', () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 30);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 14);

      const result = getSprintTimeCategory(
        `${futureStart.toISOString().split('T')[0]}T00:00:00.000Z`,
        `${futureEnd.toISOString().split('T')[0]}T23:59:59.999Z`
      );
      expect(result).toBe('future');
    });

    it('should return "past" for sprint that ended', () => {
      const pastEnd = new Date();
      pastEnd.setDate(pastEnd.getDate() - 30);
      const pastStart = new Date(pastEnd);
      pastStart.setDate(pastStart.getDate() - 14);

      const result = getSprintTimeCategory(
        `${pastStart.toISOString().split('T')[0]}T00:00:00.000Z`,
        `${pastEnd.toISOString().split('T')[0]}T23:59:59.999Z`
      );
      expect(result).toBe('past');
    });

    it('should return "current" for sprint starting today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(today);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 14);

      const result = getSprintTimeCategory(
        `${startDate.toISOString().split('T')[0]}T00:00:00.000Z`,
        `${endDate.toISOString().split('T')[0]}T23:59:59.999Z`
      );
      expect(result).toBe('current');
    });
  });

  describe('formatSprintOptionLabel', () => {
    it('should format current sprint with 🔄 icon', () => {
      const sprint: SprintWithCategory = {
        id: 'sprint-1',
        name: 'Sprint 1',
        status: 'active',
        startDate: '2026-01-01',
        endDate: '2026-01-14',
        category: 'current',
      };

      const result = formatSprintOptionLabel(sprint);
      expect(result).toBe('🔄 Sprint 1 (Active)');
    });

    it('should format future sprint with 📅 icon', () => {
      const sprint: SprintWithCategory = {
        id: 'sprint-2',
        name: 'Sprint 2',
        status: 'planned',
        startDate: '2026-02-01',
        endDate: '2026-02-14',
        category: 'future',
      };

      const result = formatSprintOptionLabel(sprint);
      expect(result).toBe('📅 Sprint 2 (Planned)');
    });

    it('should format past sprint with ✓ icon', () => {
      const sprint: SprintWithCategory = {
        id: 'sprint-3',
        name: 'Sprint 3',
        status: 'completed',
        startDate: '2025-12-01',
        endDate: '2025-12-14',
        category: 'past',
      };

      const result = formatSprintOptionLabel(sprint);
      expect(result).toBe('✓ Sprint 3 (Completed)');
    });

    it('should handle uppercase status', () => {
      const sprint: SprintWithCategory = {
        id: 'sprint-1',
        name: 'Sprint 1',
        status: 'ACTIVE',
        startDate: '2026-01-01',
        endDate: '2026-01-14',
        category: 'current',
      };

      const result = formatSprintOptionLabel(sprint);
      expect(result).toBe('🔄 Sprint 1 (Active)');
    });

    it('should handle lowercase status', () => {
      const sprint: SprintWithCategory = {
        id: 'sprint-1',
        name: 'Sprint 1',
        status: 'planned',
        startDate: '2026-02-01',
        endDate: '2026-02-14',
        category: 'future',
      };

      const result = formatSprintOptionLabel(sprint);
      expect(result).toBe('📅 Sprint 1 (Planned)');
    });

    it('should include sprint number and year when present', () => {
      const sprint: SprintWithCategory = {
        id: 'sprint-5',
        name: 'Sprint 5 2026',
        status: 'planned',
        startDate: '2026-02-01',
        endDate: '2026-02-14',
        category: 'future',
        sprintNumber: 5,
        year: 2026,
      };

      const result = formatSprintOptionLabel(sprint);
      expect(result).toBe('📅 Sprint 5 2026 (Planned)');
    });

    it('should handle sprint with goal', () => {
      const sprint: SprintWithCategory = {
        id: 'sprint-1',
        name: 'Sprint 1',
        status: 'active',
        startDate: '2026-01-01',
        endDate: '2026-01-14',
        category: 'current',
        sprintGoal: 'Complete authentication',
      };

      const result = formatSprintOptionLabel(sprint);
      expect(result).toBe('🔄 Sprint 1 (Active)');
    });
  });

  describe('generateDraftTasks', () => {
    it('should generate 1 task for 1 story point', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', 1);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Plan: Test Item - Task');
      expect(tasks[0].estimatedHours).toBe(2);
      expect(tasks[0].remainingHours).toBe(2);
      expect(tasks[0].status).toBe(TaskStatus.TODO);
    });

    it('should generate 1 task for 2 story points', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', 2);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].estimatedHours).toBe(4);
    });

    it('should generate 1 task for 3 story points', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', 3);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].estimatedHours).toBe(8);
    });

    it('should generate 2 tasks for 5 story points', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', 5);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Plan: Test Item - Task 1');
      expect(tasks[1].title).toBe('Plan: Test Item - Task 2');
      expect(tasks[0].estimatedHours).toBe(8);
    });

    it('should generate 3 tasks for 8 story points', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', 8);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].title).toBe('Plan: Test Item - Task 1');
      expect(tasks[1].title).toBe('Plan: Test Item - Task 2');
      expect(tasks[2].title).toBe('Plan: Test Item - Task 3');
    });

    it('should generate 5 tasks for 13 story points', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', 13);

      expect(tasks).toHaveLength(5);
    });

    it('should generate 1 task with default config for unknown story points', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', 21);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].estimatedHours).toBe(8);
    });

    it('should generate 1 task with default config for 0 story points', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', 0);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].estimatedHours).toBe(8);
    });

    it('should generate 1 task with default config for negative story points', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', -5);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].estimatedHours).toBe(8);
    });

    it('should use pbiId in task id', () => {
      const tasks = generateDraftTasks('unique-pbi-id', 'Test Item', 1);

      expect(tasks[0].pbiId).toBe('unique-pbi-id');
      expect(tasks[0].id).toContain('unique-pbi-id');
    });

    it('should set task status to TODO', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', 5);

      tasks.forEach((task) => {
        expect(task.status).toBe(TaskStatus.TODO);
      });
    });

    it('should set remainingHours equal to estimatedHours', () => {
      const tasks = generateDraftTasks('pbi-1', 'Test Item', 5);

      tasks.forEach((task) => {
        expect(task.remainingHours).toBe(task.estimatedHours);
      });
    });
  });

  describe('checkItemReadiness', () => {
    it('should return isReady true when all criteria are met', () => {
      const item: ProductBacklogItem = {
        id: 'pbi-1',
        title: 'Test Item',
        description: 'This is a long enough description',
        status: ItemStatus.READY,
        priority: 'MUST_HAVE',
        storyPoints: 5,
        acceptanceCriteria: 'Some acceptance criteria here',
      };

      const result = checkItemReadiness(item);
      expect(result.isReady).toBe(true);
      expect(result.checklist.every((c) => c.checked)).toBe(true);
    });

    it('should return isReady false when story points are missing', () => {
      const item: ProductBacklogItem = {
        id: 'pbi-1',
        title: 'Test Item',
        description: 'This is a long enough description',
        status: ItemStatus.READY,
        priority: 'MUST_HAVE',
        storyPoints: 0,
        acceptanceCriteria: 'Some acceptance criteria here',
      };

      const result = checkItemReadiness(item);
      expect(result.isReady).toBe(false);
    });

    it('should return isReady false when acceptance criteria is missing', () => {
      const item: ProductBacklogItem = {
        id: 'pbi-1',
        title: 'Test Item',
        description: 'This is a long enough description',
        status: ItemStatus.READY,
        priority: 'MUST_HAVE',
        storyPoints: 5,
        acceptanceCriteria: '',
      };

      const result = checkItemReadiness(item);
      expect(result.isReady).toBe(false);
    });

    it('should return isReady false when description is too short', () => {
      const item: ProductBacklogItem = {
        id: 'pbi-1',
        title: 'Test Item',
        description: 'Short',
        status: ItemStatus.READY,
        priority: 'MUST_HAVE',
        storyPoints: 5,
        acceptanceCriteria: 'Some acceptance criteria here',
      };

      const result = checkItemReadiness(item);
      expect(result.isReady).toBe(false);
    });

    it('should always mark dependencies as checked', () => {
      const item: ProductBacklogItem = {
        id: 'pbi-1',
        title: 'Test Item',
        status: ItemStatus.READY,
        priority: 'MUST_HAVE',
      };

      const result = checkItemReadiness(item);

      const dependenciesItem = result.checklist.find((c) => c.id === '3');
      expect(dependenciesItem?.checked).toBe(true);
    });

    it('should return all checklist items', () => {
      const item: ProductBacklogItem = {
        id: 'pbi-1',
        title: 'Test Item',
        status: ItemStatus.READY,
        priority: 'MUST_HAVE',
      };

      const result = checkItemReadiness(item);

      expect(result.checklist).toHaveLength(4);
      expect(result.checklist.map((c) => c.id)).toEqual(['1', '2', '3', '4']);
    });

    it('should not modify the original item', () => {
      const item: ProductBacklogItem = {
        id: 'pbi-1',
        title: 'Test Item',
        status: ItemStatus.READY,
        priority: 'MUST_HAVE',
        storyPoints: 5,
        acceptanceCriteria: 'Test criteria',
        description: 'Test description',
      };

      checkItemReadiness(item);

      expect(item).toEqual({
        id: 'pbi-1',
        title: 'Test Item',
        status: ItemStatus.READY,
        priority: 'MUST_HAVE',
        storyPoints: 5,
        acceptanceCriteria: 'Test criteria',
        description: 'Test description',
      });
    });

    it('should handle missing optional fields', () => {
      const item: ProductBacklogItem = {
        id: 'pbi-1',
        title: 'Test Item',
        status: ItemStatus.READY,
        priority: 'MUST_HAVE',
      };

      const result = checkItemReadiness(item);

      expect(result.checklist).toHaveLength(4);
    });
  });

  describe('MOSCOW_PRIORITY_CONFIG', () => {
    it('should have correct labels for all priorities', () => {
      expect(MOSCOW_PRIORITY_CONFIG.MUST_HAVE.label).toBe('Must Have');
      expect(MOSCOW_PRIORITY_CONFIG.MUST_HAVE.shortLabel).toBe('Must');

      expect(MOSCOW_PRIORITY_CONFIG.SHOULD_HAVE.label).toBe('Should Have');
      expect(MOSCOW_PRIORITY_CONFIG.SHOULD_HAVE.shortLabel).toBe('Should');

      expect(MOSCOW_PRIORITY_CONFIG.COULD_HAVE.label).toBe('Could Have');
      expect(MOSCOW_PRIORITY_CONFIG.COULD_HAVE.shortLabel).toBe('Could');

      expect(MOSCOW_PRIORITY_CONFIG.WONT_HAVE.label).toBe("Won't Have");
      expect(MOSCOW_PRIORITY_CONFIG.WONT_HAVE.shortLabel).toBe("Won't");
    });
  });
});
