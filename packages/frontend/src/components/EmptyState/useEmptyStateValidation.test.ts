import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import {
  useEmptyStateValidation,
  requiresTeam,
  requiresActiveGoal,
  requiresActiveSprint,
  getPagesRequiringCheck,
} from './useEmptyStateValidation';
import type { AppPage, UseEmptyStateValidationProps } from './types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('useEmptyStateValidation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps: UseEmptyStateValidationProps = {
    currentPage: 'Dashboard',
    hasTeam: true,
    hasActiveGoal: true,
    hasActiveSprint: true,
    isLoading: false,
  };

  const renderHookWithRouter = (props: UseEmptyStateValidationProps) => {
    return renderHook(() => useEmptyStateValidation(props), {
      wrapper: MemoryRouter,
    });
  };

  describe('Loading State', () => {
    it('should not show empty state when loading', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        isLoading: true,
        hasTeam: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(false);
      expect(result.current.emptyStateType).toBeNull();
      expect(result.current.config).toBeNull();
    });

    it('should show empty state when not loading and conditions are met', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        isLoading: false,
        hasTeam: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(true);
      expect(result.current.emptyStateType).toBe('no-team');
    });
  });

  describe('Team Validation', () => {
    it('should show no-team empty state when team is required but not present', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'Dashboard',
        hasTeam: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(true);
      expect(result.current.emptyStateType).toBe('no-team');
      expect(result.current.config).toMatchObject({
        title: 'No Team Selected',
        description: 'Please select a team to continue.',
      });
    });

    it('should not show empty state when team is present', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'Dashboard',
        hasTeam: true,
      });

      expect(result.current.shouldShowEmptyState).toBe(false);
    });

    it('should not show team empty state for TeamManagement page', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'TeamManagement',
        hasTeam: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(false);
    });
  });

  describe('Active Goal Validation', () => {
    it('should show no-active-goal empty state when goal is required but not present', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'Dashboard',
        hasTeam: true,
        hasActiveGoal: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(true);
      expect(result.current.emptyStateType).toBe('no-active-goal');
      expect(result.current.config).toMatchObject({
        title: 'No Active Goal',
        description: 'Please set an active product goal before continuing.',
      });
    });

    it('should not show goal empty state when goal is present', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'Dashboard',
        hasTeam: true,
        hasActiveGoal: true,
      });

      expect(result.current.shouldShowEmptyState).toBe(false);
    });

    it('should not show goal empty state for pages not requiring goal', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'ProductGoals',
        hasTeam: true,
        hasActiveGoal: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(false);
    });
  });

  describe('Active Sprint Validation', () => {
    it('should show no-active-sprint empty state when sprint is required but not present', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'SprintBoard',
        hasTeam: true,
        hasActiveGoal: true,
        hasActiveSprint: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(true);
      expect(result.current.emptyStateType).toBe('no-active-sprint');
      expect(result.current.config).toMatchObject({
        title: 'No Active Sprint',
        description: 'Start a new sprint from Sprint Planning to continue.',
      });
    });

    it('should not show sprint empty state when sprint is present', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'SprintBoard',
        hasTeam: true,
        hasActiveGoal: true,
        hasActiveSprint: true,
      });

      expect(result.current.shouldShowEmptyState).toBe(false);
    });

    it('should not show sprint empty state for pages not requiring sprint', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'Dashboard',
        hasTeam: true,
        hasActiveGoal: true,
        hasActiveSprint: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(false);
    });
  });

  describe('Validation Priority', () => {
    it('should prioritize team check over goal check', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'Dashboard',
        hasTeam: false,
        hasActiveGoal: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(true);
      expect(result.current.emptyStateType).toBe('no-team');
    });

    it('should prioritize team check over sprint check', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'SprintBoard',
        hasTeam: false,
        hasActiveGoal: true,
        hasActiveSprint: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(true);
      expect(result.current.emptyStateType).toBe('no-team');
    });

    it('should prioritize goal check over sprint check', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'SprintBoard',
        hasTeam: true,
        hasActiveGoal: false,
        hasActiveSprint: false,
      });

      expect(result.current.shouldShowEmptyState).toBe(true);
      expect(result.current.emptyStateType).toBe('no-active-goal');
    });
  });

  describe('Navigation Action', () => {
    it('should include navigation action for no-team state', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'Dashboard',
        hasTeam: false,
      });

      expect(result.current.config?.action).toBeDefined();
      expect(result.current.config?.action?.label).toBe('Select Team');

      result.current.config?.action?.onClick();
      expect(mockNavigate).toHaveBeenCalledWith('/team');
    });

    it('should include navigation action for no-active-goal state', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'Dashboard',
        hasActiveGoal: false,
      });

      expect(result.current.config?.action).toBeDefined();
      expect(result.current.config?.action?.label).toBe('Go to Product Goals');

      result.current.config?.action?.onClick();
      expect(mockNavigate).toHaveBeenCalledWith('/product-goals');
    });

    it('should include navigation action for no-active-sprint state', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'SprintBoard',
        hasActiveSprint: false,
      });

      expect(result.current.config?.action).toBeDefined();
      expect(result.current.config?.action?.label).toBe('Go to Sprint Planning');

      result.current.config?.action?.onClick();
      expect(mockNavigate).toHaveBeenCalledWith('/sprint-planning');
    });

    it('should use primary variant for all actions', () => {
      const { result } = renderHookWithRouter({
        ...defaultProps,
        currentPage: 'Dashboard',
        hasTeam: false,
      });

      expect(result.current.config?.action?.variant).toBe('primary');
    });
  });

  describe('All Pages Validation', () => {
    const allPages: AppPage[] = [
      'Dashboard',
      'Backlog',
      'SprintPlanning',
      'SprintBoard',
      'DailyScrum',
      'Impediments',
      'Increment',
      'SprintReview',
      'Retrospective',
      'ProductGoals',
      'TeamManagement',
      'Settings',
      'Reports',
      'Notifications',
    ];

    allPages.forEach((page) => {
      it(`should handle ${page} page without crashing`, () => {
        const { result } = renderHookWithRouter({
          ...defaultProps,
          currentPage: page,
        });

        expect(result.current).toBeDefined();
        expect(typeof result.current.shouldShowEmptyState).toBe('boolean');
      });
    });
  });

  describe('Memoization', () => {
    it('should return stable result when inputs do not change', () => {
      const { result, rerender } = renderHook((props) => useEmptyStateValidation(props), {
        initialProps: defaultProps,
        wrapper: MemoryRouter,
      });

      const firstResult = result.current;

      rerender(defaultProps);

      expect(result.current).toBe(firstResult);
    });

    it('should return new result when inputs change', () => {
      const { result, rerender } = renderHook((props) => useEmptyStateValidation(props), {
        initialProps: defaultProps,
        wrapper: MemoryRouter,
      });

      const firstResult = result.current;

      rerender({
        ...defaultProps,
        hasTeam: false,
      });

      expect(result.current).not.toBe(firstResult);
    });
  });
});

describe('Helper Functions', () => {
  describe('requiresTeam', () => {
    it('should return true for pages requiring team', () => {
      expect(requiresTeam('Dashboard')).toBe(true);
      expect(requiresTeam('Backlog')).toBe(true);
      expect(requiresTeam('SprintBoard')).toBe(true);
      expect(requiresTeam('SprintPlanning')).toBe(true);
    });

    it('should return false for pages not requiring team', () => {
      expect(requiresTeam('TeamManagement')).toBe(false);
      expect(requiresTeam('Settings')).toBe(false);
      expect(requiresTeam('Notifications')).toBe(false);
    });
  });

  describe('requiresActiveGoal', () => {
    it('should return true for pages requiring active goal', () => {
      expect(requiresActiveGoal('Dashboard')).toBe(true);
      expect(requiresActiveGoal('Backlog')).toBe(true);
      expect(requiresActiveGoal('SprintBoard')).toBe(true);
      expect(requiresActiveGoal('SprintPlanning')).toBe(true);
    });

    it('should return false for pages not requiring active goal', () => {
      expect(requiresActiveGoal('ProductGoals')).toBe(false);
      expect(requiresActiveGoal('TeamManagement')).toBe(false);
      expect(requiresActiveGoal('Settings')).toBe(false);
      expect(requiresActiveGoal('Reports')).toBe(false);
    });
  });

  describe('requiresActiveSprint', () => {
    it('should return true for pages requiring active sprint', () => {
      expect(requiresActiveSprint('SprintBoard')).toBe(true);
      expect(requiresActiveSprint('DailyScrum')).toBe(true);
      expect(requiresActiveSprint('Impediments')).toBe(true);
    });

    it('should return false for pages not requiring active sprint', () => {
      expect(requiresActiveSprint('Dashboard')).toBe(false);
      expect(requiresActiveSprint('Backlog')).toBe(false);
      expect(requiresActiveSprint('SprintPlanning')).toBe(false);
      expect(requiresActiveSprint('TeamManagement')).toBe(false);
    });
  });

  describe('getPagesRequiringCheck', () => {
    it('should return all pages requiring team check', () => {
      const pages = getPagesRequiringCheck('team');
      expect(pages).toContain('Dashboard');
      expect(pages).toContain('Backlog');
      expect(pages).toContain('SprintBoard');
      expect(pages).not.toContain('TeamManagement');
      expect(pages).not.toContain('Settings');
    });

    it('should return all pages requiring goal check', () => {
      const pages = getPagesRequiringCheck('goal');
      expect(pages).toContain('Dashboard');
      expect(pages).toContain('Backlog');
      expect(pages).toContain('SprintBoard');
      expect(pages).not.toContain('ProductGoals');
      expect(pages).not.toContain('TeamManagement');
    });

    it('should return all pages requiring sprint check', () => {
      const pages = getPagesRequiringCheck('sprint');
      expect(pages).toContain('SprintBoard');
      expect(pages).toContain('DailyScrum');
      expect(pages).toContain('Impediments');
      expect(pages).not.toContain('Dashboard');
      expect(pages).not.toContain('Backlog');
    });

    it('should return empty array for invalid check type', () => {
      const pages = getPagesRequiringCheck('invalid' as any);
      expect(pages).toEqual([]);
    });
  });
});

describe('Page-Specific Validation Configurations', () => {
  const renderHookWithRouter = (props: UseEmptyStateValidationProps) => {
    return renderHook(() => useEmptyStateValidation(props), {
      wrapper: MemoryRouter,
    });
  };

  describe('Pages requiring ALL checks (Team, Goal, Sprint)', () => {
    const allCheckPages: AppPage[] = ['SprintBoard', 'DailyScrum', 'Impediments'];

    allCheckPages.forEach((page) => {
      describe(page, () => {
        it('should require all three checks', () => {
          const { result: noTeam } = renderHookWithRouter({
            currentPage: page,
            hasTeam: false,
            hasActiveGoal: false,
            hasActiveSprint: false,
            isLoading: false,
          });
          expect(noTeam.current.emptyStateType).toBe('no-team');

          const { result: noGoal } = renderHookWithRouter({
            currentPage: page,
            hasTeam: true,
            hasActiveGoal: false,
            hasActiveSprint: false,
            isLoading: false,
          });
          expect(noGoal.current.emptyStateType).toBe('no-active-goal');

          const { result: noSprint } = renderHookWithRouter({
            currentPage: page,
            hasTeam: true,
            hasActiveGoal: true,
            hasActiveSprint: false,
            isLoading: false,
          });
          expect(noSprint.current.emptyStateType).toBe('no-active-sprint');
        });
      });
    });
  });

  describe('Pages requiring Team and Goal checks', () => {
    const teamGoalPages: AppPage[] = [
      'Dashboard',
      'Backlog',
      'SprintPlanning',
      'Increment',
      'SprintReview',
      'Retrospective',
    ];

    teamGoalPages.forEach((page) => {
      describe(page, () => {
        it('should require team and goal but not sprint', () => {
          const { result: noTeam } = renderHookWithRouter({
            currentPage: page,
            hasTeam: false,
            hasActiveGoal: true,
            hasActiveSprint: false,
            isLoading: false,
          });
          expect(noTeam.current.emptyStateType).toBe('no-team');

          const { result: noGoal } = renderHookWithRouter({
            currentPage: page,
            hasTeam: true,
            hasActiveGoal: false,
            hasActiveSprint: false,
            isLoading: false,
          });
          expect(noGoal.current.emptyStateType).toBe('no-active-goal');

          const { result: noSprintButOk } = renderHookWithRouter({
            currentPage: page,
            hasTeam: true,
            hasActiveGoal: true,
            hasActiveSprint: false,
            isLoading: false,
          });
          expect(noSprintButOk.current.shouldShowEmptyState).toBe(false);
        });
      });
    });
  });

  describe('Pages requiring only Team check', () => {
    it('ProductGoals should only require team', () => {
      const { result: noTeam } = renderHookWithRouter({
        currentPage: 'ProductGoals',
        hasTeam: false,
        hasActiveGoal: false,
        hasActiveSprint: false,
        isLoading: false,
      });
      expect(noTeam.current.emptyStateType).toBe('no-team');

      const { result: hasTeam } = renderHookWithRouter({
        currentPage: 'ProductGoals',
        hasTeam: true,
        hasActiveGoal: false,
        hasActiveSprint: false,
        isLoading: false,
      });
      expect(hasTeam.current.shouldShowEmptyState).toBe(false);
    });
  });

  describe('Pages with no mandatory checks', () => {
    const noCheckPages: AppPage[] = ['TeamManagement', 'Settings', 'Notifications'];

    noCheckPages.forEach((page) => {
      it(`${page} should not require any checks`, () => {
        const { result } = renderHookWithRouter({
          currentPage: page,
          hasTeam: false,
          hasActiveGoal: false,
          hasActiveSprint: false,
          isLoading: false,
        });
        expect(result.current.shouldShowEmptyState).toBe(false);
      });
    });
  });

  describe('Reports page', () => {
    it('should only require team', () => {
      const { result: noTeam } = renderHookWithRouter({
        currentPage: 'Reports',
        hasTeam: false,
        hasActiveGoal: false,
        hasActiveSprint: false,
        isLoading: false,
      });
      expect(noTeam.current.emptyStateType).toBe('no-team');

      const { result: hasTeam } = renderHookWithRouter({
        currentPage: 'Reports',
        hasTeam: true,
        hasActiveGoal: false,
        hasActiveSprint: false,
        isLoading: false,
      });
      expect(hasTeam.current.shouldShowEmptyState).toBe(false);
    });
  });
});

describe('Edge Cases', () => {
  const renderHookWithRouter = (props: UseEmptyStateValidationProps) => {
    return renderHook(() => useEmptyStateValidation(props), {
      wrapper: MemoryRouter,
    });
  };

  it('should handle all boolean combinations of state flags', () => {
    const combinations = [
      { hasTeam: false, hasActiveGoal: false, hasActiveSprint: false },
      { hasTeam: false, hasActiveGoal: false, hasActiveSprint: true },
      { hasTeam: false, hasActiveGoal: true, hasActiveSprint: false },
      { hasTeam: false, hasActiveGoal: true, hasActiveSprint: true },
      { hasTeam: true, hasActiveGoal: false, hasActiveSprint: false },
      { hasTeam: true, hasActiveGoal: false, hasActiveSprint: true },
      { hasTeam: true, hasActiveGoal: true, hasActiveSprint: false },
      { hasTeam: true, hasActiveGoal: true, hasActiveSprint: true },
    ];

    combinations.forEach((combo) => {
      const { result } = renderHookWithRouter({
        currentPage: 'SprintBoard',
        ...combo,
        isLoading: false,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.shouldShowEmptyState).toBe('boolean');
    });
  });

  it('should handle undefined isLoading as false', () => {
    const { result } = renderHookWithRouter({
      currentPage: 'Dashboard',
      hasTeam: false,
      hasActiveGoal: true,
      hasActiveSprint: true,
      isLoading: undefined as any,
    });

    expect(result.current.shouldShowEmptyState).toBe(true);
  });

  it('should have consistent config structure when empty state is shown', () => {
    const { result } = renderHookWithRouter({
      currentPage: 'Dashboard',
      hasTeam: false,
      hasActiveGoal: true,
      hasActiveSprint: true,
      isLoading: false,
    });

    const config = result.current.config;
    expect(config).toHaveProperty('icon');
    expect(config).toHaveProperty('title');
    expect(config).toHaveProperty('description');
    expect(config).toHaveProperty('action');
    expect(config?.action).toHaveProperty('label');
    expect(config?.action).toHaveProperty('onClick');
    expect(config?.action).toHaveProperty('variant');
  });

  it('should have null config when no empty state is shown', () => {
    const { result } = renderHookWithRouter({
      currentPage: 'Dashboard',
      hasTeam: true,
      hasActiveGoal: true,
      hasActiveSprint: true,
      isLoading: false,
    });

    expect(result.current.config).toBeNull();
  });
});
