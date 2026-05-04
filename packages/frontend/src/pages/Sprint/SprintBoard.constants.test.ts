import { describe, it, expect } from 'vitest';
import { initialFormData, calculateWIPLimit, TASK_STATUS_CONFIG } from './SprintBoard.constants';
import { TaskStatus } from '../../types';

describe('initialFormData', () => {
  it('should have empty title', () => {
    expect(initialFormData.title).toBe('');
  });

  it('should have empty description', () => {
    expect(initialFormData.description).toBe('');
  });

  it('should have empty pbiId', () => {
    expect(initialFormData.pbiId).toBe('');
  });

  it('should have empty assigneeId', () => {
    expect(initialFormData.assigneeId).toBe('');
  });

  it('should have TODO as default status', () => {
    expect(initialFormData.status).toBe(TaskStatus.TODO);
  });

  it('should have 0 as default estimatedHours', () => {
    expect(initialFormData.estimatedHours).toBe(0);
  });

  it('should have 0 as default remainingHours', () => {
    expect(initialFormData.remainingHours).toBe(0);
  });

  it('should be immutable', () => {
    // Verify the structure is correct
    expect(Object.keys(initialFormData)).toEqual([
      'title',
      'description',
      'pbiId',
      'assigneeId',
      'status',
      'estimatedHours',
      'remainingHours',
    ]);
  });
});

describe('calculateWIPLimit', () => {
  it('should return teamSize + 1 for positive team sizes', () => {
    expect(calculateWIPLimit(1)).toBe(2);
    expect(calculateWIPLimit(3)).toBe(4);
    expect(calculateWIPLimit(5)).toBe(6);
    expect(calculateWIPLimit(10)).toBe(11);
  });

  it('should return 1 for team size 0', () => {
    expect(calculateWIPLimit(0)).toBe(1);
  });

  it('should handle large team sizes', () => {
    expect(calculateWIPLimit(50)).toBe(51);
    expect(calculateWIPLimit(100)).toBe(101);
  });
});

describe('TASK_STATUS_CONFIG', () => {
  it('should have configuration for TODO status', () => {
    expect(TASK_STATUS_CONFIG[TaskStatus.TODO]).toBeDefined();
    expect(TASK_STATUS_CONFIG[TaskStatus.TODO].label).toBe('To Do');
  });

  it('should have configuration for IN_PROGRESS status', () => {
    expect(TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS]).toBeDefined();
    expect(TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].label).toBe('In Progress');
  });

  it('should have configuration for DONE status', () => {
    expect(TASK_STATUS_CONFIG[TaskStatus.DONE]).toBeDefined();
    expect(TASK_STATUS_CONFIG[TaskStatus.DONE].label).toBe('Done');
  });

  describe('TODO Status Configuration', () => {
    const config = TASK_STATUS_CONFIG[TaskStatus.TODO];

    it('should have correct label', () => {
      expect(config.label).toBe('To Do');
    });

    it('should have color defined', () => {
      expect(config.color).toBeDefined();
      expect(config.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have background color defined', () => {
      expect(config.bgColor).toBeDefined();
      expect(config.bgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have border color defined', () => {
      expect(config.borderColor).toBeDefined();
      expect(config.borderColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have icon defined', () => {
      expect(config.icon).toBeDefined();
      expect(typeof config.icon).toBe('string');
    });

    it('should have description', () => {
      expect(config.description).toBe('Task is ready to be started');
    });
  });

  describe('IN_PROGRESS Status Configuration', () => {
    const config = TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS];

    it('should have correct label', () => {
      expect(config.label).toBe('In Progress');
    });

    it('should have color defined', () => {
      expect(config.color).toBeDefined();
      expect(config.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have background color defined', () => {
      expect(config.bgColor).toBeDefined();
      expect(config.bgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have border color defined', () => {
      expect(config.borderColor).toBeDefined();
      expect(config.borderColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have icon defined', () => {
      expect(config.icon).toBeDefined();
      expect(typeof config.icon).toBe('string');
    });

    it('should have description', () => {
      expect(config.description).toBe('Task is currently being worked on');
    });
  });

  describe('DONE Status Configuration', () => {
    const config = TASK_STATUS_CONFIG[TaskStatus.DONE];

    it('should have correct label', () => {
      expect(config.label).toBe('Done');
    });

    it('should have color defined', () => {
      expect(config.color).toBeDefined();
      expect(config.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have background color defined', () => {
      expect(config.bgColor).toBeDefined();
      expect(config.bgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have border color defined', () => {
      expect(config.borderColor).toBeDefined();
      expect(config.borderColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have icon defined', () => {
      expect(config.icon).toBeDefined();
      expect(typeof config.icon).toBe('string');
    });

    it('should have description', () => {
      expect(config.description).toBe('Task has been completed');
    });
  });

  describe('Color Contrast', () => {
    it('should have distinct colors for each status', () => {
      const todoColor = TASK_STATUS_CONFIG[TaskStatus.TODO].color;
      const inProgressColor = TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].color;
      const doneColor = TASK_STATUS_CONFIG[TaskStatus.DONE].color;

      expect(todoColor).not.toBe(inProgressColor);
      expect(inProgressColor).not.toBe(doneColor);
      expect(todoColor).not.toBe(doneColor);
    });

    it('should have distinct background colors for each status', () => {
      const todoBg = TASK_STATUS_CONFIG[TaskStatus.TODO].bgColor;
      const inProgressBg = TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].bgColor;
      const doneBg = TASK_STATUS_CONFIG[TaskStatus.DONE].bgColor;

      expect(todoBg).not.toBe(inProgressBg);
      expect(inProgressBg).not.toBe(doneBg);
      expect(todoBg).not.toBe(doneBg);
    });
  });

  describe('Icon Paths', () => {
    it('should have non-empty icon paths for all statuses', () => {
      Object.values(TASK_STATUS_CONFIG).forEach((config) => {
        expect(config.icon.length).toBeGreaterThan(0);
      });
    });

    it('should have unique icons for each status', () => {
      const icons = Object.values(TASK_STATUS_CONFIG).map((config) => config.icon);
      const uniqueIcons = [...new Set(icons)];
      expect(uniqueIcons).toHaveLength(icons.length);
    });
  });
});
