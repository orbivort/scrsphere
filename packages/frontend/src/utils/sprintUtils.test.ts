import {
  getSprintTimeCategory,
  formatSprintOptionLabel,
  calculateSprintDuration,
  getRecommendedPlanningTime,
} from './sprintUtils';

describe('sprintUtils', () => {
  describe('getSprintTimeCategory', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return current for ongoing sprint', () => {
      const now = new Date('2024-01-15');
      vi.setSystemTime(now);

      const startDate = '2024-01-10';
      const endDate = '2024-01-20';

      expect(getSprintTimeCategory(startDate, endDate)).toBe('current');
    });

    it('should return future for upcoming sprint', () => {
      const now = new Date('2024-01-05');
      vi.setSystemTime(now);

      const startDate = '2024-01-10';
      const endDate = '2024-01-20';

      expect(getSprintTimeCategory(startDate, endDate)).toBe('future');
    });

    it('should return past for completed sprint', () => {
      const now = new Date('2024-01-25');
      vi.setSystemTime(now);

      const startDate = '2024-01-10';
      const endDate = '2024-01-20';

      expect(getSprintTimeCategory(startDate, endDate)).toBe('past');
    });
  });

  describe('formatSprintOptionLabel', () => {
    it('should format sprint label with current icon', () => {
      const sprint = {
        name: 'Sprint 1',
        status: 'active',
        startDate: '2024-01-10',
        endDate: '2024-01-20',
        category: 'current' as const,
      };

      const label = formatSprintOptionLabel(sprint);
      expect(label).toContain('🔄');
      expect(label).toContain('Sprint 1');
      expect(label).toContain('Active');
    });

    it('should format sprint label with future icon', () => {
      const sprint = {
        name: 'Sprint 2',
        status: 'planned',
        startDate: '2024-01-21',
        endDate: '2024-01-30',
        category: 'future' as const,
      };

      const label = formatSprintOptionLabel(sprint);
      expect(label).toContain('📅');
      expect(label).toContain('Sprint 2');
      expect(label).toContain('Planned');
    });
  });

  describe('calculateSprintDuration', () => {
    it('should calculate business days correctly for one week', () => {
      const startDate = '2024-01-08'; // Monday
      const endDate = '2024-01-12'; // Friday

      const duration = calculateSprintDuration(startDate, endDate);
      expect(duration).toBe(5);
    });

    it('should calculate business days correctly for two weeks', () => {
      const startDate = '2024-01-08'; // Monday
      const endDate = '2024-01-19'; // Friday next week

      const duration = calculateSprintDuration(startDate, endDate);
      expect(duration).toBe(10);
    });

    it('should exclude weekends', () => {
      const startDate = '2024-01-08'; // Monday
      const endDate = '2024-01-14'; // Sunday

      const duration = calculateSprintDuration(startDate, endDate);
      expect(duration).toBe(5); // Only Mon-Fri
    });
  });

  describe('getRecommendedPlanningTime', () => {
    it('should return 2 hours for one week sprint', () => {
      const startDate = '2024-01-08'; // Monday
      const endDate = '2024-01-12'; // Friday

      const planningTime = getRecommendedPlanningTime(startDate, endDate);
      expect(planningTime).toBe(2 * 60 * 60); // 2 hours in seconds
    });

    it('should return 4 hours for two week sprint', () => {
      const startDate = '2024-01-08'; // Monday
      const endDate = '2024-01-19'; // Friday next week

      const planningTime = getRecommendedPlanningTime(startDate, endDate);
      expect(planningTime).toBe(4 * 60 * 60); // 4 hours in seconds
    });
  });
});
