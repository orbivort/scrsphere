/* eslint-disable react-refresh/only-export-components --
   This is a test utility file that intentionally exports both React components
   (AllProviders) and helper functions (createTestQueryClient, renderWithProviders,
   createMockUser, etc.) for use in tests. Separating these would reduce cohesion
   and make the testing API less ergonomic. */
import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import {
  SprintStatus,
  TaskStatus,
  ItemStatus,
  MoSCoWPriority,
  type User,
  type Team,
  type Sprint,
  type Task,
  type ProductBacklogItem,
  type ProductGoal,
} from './types';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

export const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  queryClient = createTestQueryClient(),
  initialRoute = '/',
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { queryClient, initialRoute, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient} initialRoute={initialRoute}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
};

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  name: 'Test Team',
  description: 'Test team description',
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [],
  ...overrides,
});

export const createMockSprint = (overrides: Partial<Sprint> = {}): Sprint => ({
  id: 'sprint-1',
  teamId: 'team-1',
  name: 'Sprint 1',
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-01-14T23:59:59Z',
  status: SprintStatus.ACTIVE,
  sprintGoal: 'Test goal',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  sprintId: 'sprint-1',
  pbiId: 'pbi-1',
  title: 'Test Task',
  status: TaskStatus.TODO,
  assigneeId: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const createMockBacklogItem = (
  overrides: Partial<ProductBacklogItem> = {}
): ProductBacklogItem => ({
  id: 'pbi-1',
  teamId: 'team-1',
  title: 'User Authentication',
  description: 'Implement user login/logout',
  status: ItemStatus.NEW,
  priority: MoSCoWPriority.MUST_HAVE,
  storyPoints: 8,
  businessValue: 10,
  labels: ['security', 'authentication'],
  acceptanceCriteria: 'Users can log in and out securely',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  createdBy: 'user-1',
  ...overrides,
});

export const createMockProductGoal = (overrides: Partial<ProductGoal> = {}): ProductGoal => ({
  id: 'goal-1',
  teamId: 'team-1',
  title: 'Test Product Goal',
  description: 'Test goal description',
  status: 'ACTIVE',
  targetDate: '2026-12-31T00:00:00Z',
  successMetrics: 'Test metrics',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export * from '@testing-library/react';
