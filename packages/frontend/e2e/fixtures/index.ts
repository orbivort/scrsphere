import { test as base, type Page, type Route, type Request } from '@playwright/test';
import {
  LoginPage,
  DashboardPage,
  TeamPage,
  BacklogPage,
  SprintBoardPage,
  SprintPlanningPage,
  TeamManagementPage,
  ImpedimentsPage,
  DailyScrumPage,
  SprintReviewPage,
  ProductGoalsPage,
  IncrementsPage,
  RetrospectivesPage,
  ReportsPage,
} from '../pages';
import { generateTestUser, type TestUser } from './dataFactory';

type AuthFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  teamPage: TeamPage;
  backlogPage: BacklogPage;
  sprintBoardPage: SprintBoardPage;
  sprintPlanningPage: SprintPlanningPage;
  teamManagementPage: TeamManagementPage;
  impedimentsPage: ImpedimentsPage;
  dailyScrumPage: DailyScrumPage;
  sprintReviewPage: SprintReviewPage;
  productGoalsPage: ProductGoalsPage;
  incrementsPage: IncrementsPage;
  retrospectivesPage: RetrospectivesPage;
  reportsPage: ReportsPage;
};

type TestUserFixtures = {
  testUser: TestUser;
  registeredUser: TestUser;
};

type MockApiFixtures = {
  mockApi: void;
};

const mockBacklogItems = [
  {
    id: 'pbi-1',
    title: 'User Authentication',
    description: 'Implement user login and registration',
    status: 'new',
    priority: 'must_have',
    storyPoints: 8,
    businessValue: 100,
    labels: ['auth', 'security'],
    acceptanceCriteria: 'Users can log in and log out',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pbi-2',
    title: 'Dashboard Overview',
    description: 'Create main dashboard with sprint metrics',
    status: 'refined',
    priority: 'should_have',
    storyPoints: 5,
    businessValue: 80,
    labels: ['ui', 'dashboard'],
    acceptanceCriteria: 'Dashboard shows sprint progress',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pbi-3',
    title: 'Task Management',
    description: 'Allow users to create and manage tasks',
    status: 'ready',
    priority: 'must_have',
    storyPoints: 13,
    businessValue: 100,
    labels: ['tasks', 'core'],
    acceptanceCriteria: 'CRUD operations for tasks',
    createdAt: new Date().toISOString(),
  },
];

const mockSprint = {
  id: 'sprint-1',
  name: 'Sprint 1',
  sprintGoal: 'Complete authentication and dashboard',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
};

const mockTasks = [
  {
    id: 'task-1',
    title: 'Setup login page',
    description: 'Create login page UI',
    status: 'todo',
    pbiId: 'pbi-1',
    estimatedHours: 4,
    remainingHours: 4,
    assigneeId: null,
  },
  {
    id: 'task-2',
    title: 'Implement auth API',
    description: 'Connect to backend auth endpoints',
    status: 'in_progress',
    pbiId: 'pbi-1',
    estimatedHours: 8,
    remainingHours: 5,
    assigneeId: 'user-1',
  },
  {
    id: 'task-3',
    title: 'Write unit tests',
    description: 'Add test coverage for auth',
    status: 'done',
    pbiId: 'pbi-1',
    estimatedHours: 3,
    remainingHours: 0,
    assigneeId: 'user-2',
  },
];

const mockTeamMembers = [
  { id: 'user-1', name: 'John Developer', email: 'john@example.com', role: 'developer' },
  { id: 'user-2', name: 'Jane Tester', email: 'jane@example.com', role: 'tester' },
];

const mockActiveGoal = {
  id: 'goal-1',
  name: 'MVP Release',
  description: 'First release with core features',
  status: 'active',
};

type MockUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
};

const pageUserMap = new WeakMap<Page, MockUser>();

const pageRegisteredUsers = new WeakMap<Page, Map<string, MockUser>>();

const MOCK_CSRF_TOKEN = 'mock-csrf-token-12345';

function getRegisteredUsers(page: Page): Map<string, MockUser> {
  let users = pageRegisteredUsers.get(page);
  if (!users) {
    users = new Map();
    pageRegisteredUsers.set(page, users);
  }
  return users;
}

export async function clearMockAuthState(page: Page): Promise<void> {
  pageUserMap.delete(page);

  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch {
    // Retry once if navigation fails
    await page.waitForTimeout(500);
    await page.goto('/login', { waitUntil: 'load', timeout: 15000 });
  }

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  const context = page.context();
  await context.clearCookies();
  await context.addCookies([
    {
      name: 'csrfToken',
      value: MOCK_CSRF_TOKEN,
      domain: 'localhost',
      path: '/',
      sameSite: 'Strict',
    },
  ]);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
}

async function mockAuthApi(page: Page) {
  await page.route('**/api/v1/auth/csrf-token', async (route: Route) => {
    const context = page.context();
    await context.addCookies([
      {
        name: 'csrfToken',
        value: MOCK_CSRF_TOKEN,
        domain: 'localhost',
        path: '/',
        sameSite: 'Strict',
      },
    ]);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { csrfToken: MOCK_CSRF_TOKEN },
      }),
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:5173',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  });

  await page.route('**/api/v1/auth/me', async (route: Route) => {
    const user = pageUserMap.get(page);
    if (user) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: user,
        }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          },
        }),
      });
    }
  });

  await page.route('**/api/v1/auth/register', async (route: Route) => {
    const request = route.request();
    const body = request.postDataJSON() || {};

    const user = {
      id: 'test-user-id',
      email: body.email || '',
      firstName: body.firstName || 'Test',
      lastName: body.lastName || 'User',
      createdAt: new Date().toISOString(),
    };
    pageUserMap.set(page, user);
    getRegisteredUsers(page).set(user.email, user);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: user,
          sessionInfo: {
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            idleTimeoutMs: 30 * 60 * 1000,
            absoluteTimeoutMs: 24 * 60 * 60 * 1000,
            warningThresholdMs: 5 * 60 * 1000,
          },
        },
      }),
    });
  });

  await page.route('**/api/v1/auth/login', async (route: Route) => {
    const request = route.request();
    const body = request.postDataJSON() || {};

    const email = body.email || '';
    const password = body.password || '';

    if (email.includes('invalid') || password.includes('wrong')) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          },
        }),
      });
      return;
    }

    const registeredUser = getRegisteredUsers(page).get(email);
    const user = registeredUser || {
      id: 'test-user-id',
      email: email,
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString(),
    };
    pageUserMap.set(page, user);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: user,
          sessionInfo: {
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            idleTimeoutMs: 30 * 60 * 1000,
            absoluteTimeoutMs: 24 * 60 * 60 * 1000,
            warningThresholdMs: 5 * 60 * 1000,
          },
        },
      }),
    });
  });

  await page.route('**/api/v1/auth/logout', async (route: Route) => {
    pageUserMap.delete(page);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/v1/teams/my-teams', async (route: Route) => {
    const now = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'team-1',
            name: 'Test Team',
            slug: 'test-team',
            description: 'A test team for E2E testing',
            createdBy: 'test-user-id',
            createdAt: now,
            updatedAt: now,
            userRole: 'ADMIN',
          },
        ],
      }),
    });
  });

  await page.route('**/api/v1/sprint/active', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockSprint,
      }),
    });
  });

  await page.route('**/api/v1/tasks**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockTasks,
      }),
    });
  });

  await page.route('**/api/v1/tasks/my-tasks', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockTasks,
      }),
    });
  });

  await page.route('**/api/v1/impediments**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });

  await page.route('**/api/v1/product-backlog**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockBacklogItems,
      }),
    });
  });

  await page.route('**/api/v1/product-goals/active', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockActiveGoal,
      }),
    });
  });

  await page.route('**/api/v1/teams/*/members', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockTeamMembers,
      }),
    });
  });

  await page.route('**/api/v1/sprint/*/items', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockBacklogItems.filter((item) => item.status === 'ready'),
      }),
    });
  });

  await page.route('**/api/v1/dor-items', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 'dor-1', description: 'Has clear acceptance criteria', order: 1 },
          { id: 'dor-2', description: 'Estimated by team', order: 2 },
        ],
      }),
    });
  });

  await page.route('**/api/v1/dod-items', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 'dod-1', description: 'Code reviewed', order: 1 },
          { id: 'dod-2', description: 'Tests passing', order: 2 },
        ],
      }),
    });
  });

  await page.route('**/api/v1/wip-limits', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { todo: 10, in_progress: 5, done: null },
      }),
    });
  });

  await page.route('**/api/v1/daily-updates/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });

  await page.route('**/api/v1/reports/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });

  await page.route('**/api/v1/increments**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });

  await page.route('**/api/v1/retrospectives/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });

  await page.route('**/api/v1/sprints**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });

  await page.route('**/api/v1/product-goals**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });

  await page.route('**/api/v1/sprint-reviews**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });

  await page.route('**/api/v1/sprint/*/burndown', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          dates: ['2024-01-01', '2024-01-02', '2024-01-03'],
          ideal: [100, 80, 60],
          actual: [100, 85, 70],
        },
      }),
    });
  });

  await page.route('**/api/v1/sprints/active', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockSprint,
      }),
    });
  });

  await page.route('**/api/v1/workflows/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });
}

export const test = base.extend<AuthFixtures & TestUserFixtures & MockApiFixtures>({
  mockApi: async ({ page }, use) => {
    await mockAuthApi(page);
    const context = page.context();
    await context.addCookies([
      {
        name: 'csrfToken',
        value: MOCK_CSRF_TOKEN,
        domain: 'localhost',
        path: '/',
        sameSite: 'Strict',
      },
    ]);
    await use();
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  teamPage: async ({ page }, use) => {
    const teamPage = new TeamPage(page);
    await use(teamPage);
  },

  backlogPage: async ({ page }, use) => {
    const backlogPage = new BacklogPage(page);
    await use(backlogPage);
  },

  sprintBoardPage: async ({ page }, use) => {
    const sprintBoardPage = new SprintBoardPage(page);
    await use(sprintBoardPage);
  },

  sprintPlanningPage: async ({ page }, use) => {
    const sprintPlanningPage = new SprintPlanningPage(page);
    await use(sprintPlanningPage);
  },

  teamManagementPage: async ({ page }, use) => {
    const teamManagementPage = new TeamManagementPage(page);
    await use(teamManagementPage);
  },

  impedimentsPage: async ({ page }, use) => {
    const impedimentsPage = new ImpedimentsPage(page);
    await use(impedimentsPage);
  },

  dailyScrumPage: async ({ page }, use) => {
    const dailyScrumPage = new DailyScrumPage(page);
    await use(dailyScrumPage);
  },

  sprintReviewPage: async ({ page }, use) => {
    const sprintReviewPage = new SprintReviewPage(page);
    await use(sprintReviewPage);
  },

  productGoalsPage: async ({ page }, use) => {
    const productGoalsPage = new ProductGoalsPage(page);
    await use(productGoalsPage);
  },

  incrementsPage: async ({ page }, use) => {
    const incrementsPage = new IncrementsPage(page);
    await use(incrementsPage);
  },

  retrospectivesPage: async ({ page }, use) => {
    const retrospectivesPage = new RetrospectivesPage(page);
    await use(retrospectivesPage);
  },

  reportsPage: async ({ page }, use) => {
    const reportsPage = new ReportsPage(page);
    await use(reportsPage);
  },

  testUser: async ({}, use) => {
    const user = generateTestUser();
    await use(user);
  },

  registeredUser: async ({ loginPage, page, mockApi }, use) => {
    const user = generateTestUser();
    await loginPage.goto();
    await loginPage.register({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      acceptTerms: true,
    });
    await page.waitForURL(/\/team/, { timeout: 30000 });
    await clearMockAuthState(page);
    await use(user);
  },
});

export { expect } from '@playwright/test';
