import {
  createTestUser,
  createTestTeam,
  createTestSprint,
  createTestTask,
  createTestPBI,
  createTestRefreshToken,
  generateTestUUID,
} from '../setup/testSetup';

export { generateTestUUID };

export const fixtures = {
  users: {
    validUser: (overrides: Record<string, unknown> = {}) =>
      createTestUser({
        email: 'valid@example.com',
        firstName: 'Valid',
        lastName: 'User',
        ...overrides,
      }),

    adminUser: (overrides: Record<string, unknown> = {}) =>
      createTestUser({
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        ...overrides,
      }),

    productOwner: (overrides: Record<string, unknown> = {}) =>
      createTestUser({
        email: 'po@example.com',
        firstName: 'Product',
        lastName: 'Owner',
        ...overrides,
      }),

    scrumMaster: (overrides: Record<string, unknown> = {}) =>
      createTestUser({
        email: 'sm@example.com',
        firstName: 'Scrum',
        lastName: 'Master',
        ...overrides,
      }),

    developer: (overrides: Record<string, unknown> = {}) =>
      createTestUser({
        email: 'dev@example.com',
        firstName: 'Developer',
        lastName: 'User',
        ...overrides,
      }),
  },

  teams: {
    validTeam: (overrides: Record<string, unknown> = {}) =>
      createTestTeam({
        name: 'Valid Team',
        description: 'A valid test team',
        ...overrides,
      }),

    scrumTeam: (overrides: Record<string, unknown> = {}) =>
      createTestTeam({
        name: 'Scrum Team Alpha',
        description: 'An agile scrum team',
        ...overrides,
      }),
  },

  sprints: {
    plannedSprint: (overrides: Record<string, unknown> = {}) =>
      createTestSprint({
        name: 'Sprint 1',
        status: 'PLANNED',
        sprintGoal: 'Complete initial setup',
        ...overrides,
      }),

    activeSprint: (overrides: Record<string, unknown> = {}) =>
      createTestSprint({
        name: 'Sprint 2',
        status: 'ACTIVE',
        sprintGoal: 'Deliver MVP features',
        ...overrides,
      }),

    completedSprint: (overrides: Record<string, unknown> = {}) =>
      createTestSprint({
        name: 'Sprint 0',
        status: 'COMPLETED',
        sprintGoal: 'Project setup completed',
        ...overrides,
      }),

    cancelledSprint: (overrides: Record<string, unknown> = {}) =>
      createTestSprint({
        name: 'Cancelled Sprint',
        status: 'CANCELLED',
        cancellationReason: 'Requirements changed',
        ...overrides,
      }),
  },

  tasks: {
    todoTask: (overrides: Record<string, unknown> = {}) =>
      createTestTask({
        title: 'Setup database',
        status: 'TODO',
        estimatedHours: 4,
        remainingHours: 4,
        ...overrides,
      }),

    inProgressTask: (overrides: Record<string, unknown> = {}) =>
      createTestTask({
        title: 'Implement authentication',
        status: 'IN_PROGRESS',
        estimatedHours: 8,
        remainingHours: 5,
        ...overrides,
      }),

    doneTask: (overrides: Record<string, unknown> = {}) =>
      createTestTask({
        title: 'Write tests',
        status: 'DONE',
        estimatedHours: 4,
        remainingHours: 0,
        ...overrides,
      }),
  },

  pbis: {
    newPBI: (overrides: Record<string, unknown> = {}) =>
      createTestPBI({
        title: 'New Feature',
        status: 'NEW',
        priority: 'COULD_HAVE',
        ...overrides,
      }),

    refinedPBI: (overrides: Record<string, unknown> = {}) =>
      createTestPBI({
        title: 'Refined Feature',
        status: 'REFINED',
        priority: 'SHOULD_HAVE',
        storyPoints: 5,
        ...overrides,
      }),

    readyPBI: (overrides: Record<string, unknown> = {}) =>
      createTestPBI({
        title: 'Ready Feature',
        status: 'READY',
        priority: 'MUST_HAVE',
        storyPoints: 8,
        ...overrides,
      }),

    inProgressPBI: (overrides: Record<string, unknown> = {}) =>
      createTestPBI({
        title: 'In Progress Feature',
        status: 'IN_PROGRESS',
        priority: 'MUST_HAVE',
        storyPoints: 13,
        ...overrides,
      }),

    donePBI: (overrides: Record<string, unknown> = {}) =>
      createTestPBI({
        title: 'Completed Feature',
        status: 'DONE',
        priority: 'MUST_HAVE',
        storyPoints: 5,
        ...overrides,
      }),
  },

  tokens: {
    validRefreshToken: (overrides: Record<string, unknown> = {}) =>
      createTestRefreshToken({
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
        revokedAt: null,
        ...overrides,
      }),

    expiredRefreshToken: (overrides: Record<string, unknown> = {}) =>
      createTestRefreshToken({
        expiresAt: new Date(Date.now() - 1000),
        lastActivityAt: new Date(),
        revokedAt: null,
        ...overrides,
      }),

    revokedRefreshToken: (overrides: Record<string, unknown> = {}) =>
      createTestRefreshToken({
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
        revokedAt: new Date(),
        ...overrides,
      }),

    idleTimeoutRefreshToken: (overrides: Record<string, unknown> = {}) =>
      createTestRefreshToken({
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(Date.now() - 60 * 60 * 1000),
        revokedAt: null,
        ...overrides,
      }),
  },

  notifications: {
    unreadNotification: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      userId: generateTestUUID(),
      type: 'TEAM_INVITATION',
      title: 'Team Invitation',
      message: 'You have been invited to join a team',
      data: { teamId: generateTestUUID() },
      isRead: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),

    readNotification: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      userId: generateTestUUID(),
      type: 'SYSTEM',
      title: 'System Notification',
      message: 'Your settings have been updated',
      data: {},
      isRead: true,
      readAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),
  },

  goals: {
    validGoal: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      teamId: generateTestUUID(),
      title: 'Q1 Product Goal',
      description: 'Deliver core features for Q1',
      status: 'DRAFT',
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      completedAt: null,
      ...overrides,
    }),

    activeGoal: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      teamId: generateTestUUID(),
      title: 'Active Product Goal',
      description: 'Currently in progress',
      status: 'ACTIVE',
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      completedAt: null,
      ...overrides,
    }),

    completedGoal: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      teamId: generateTestUUID(),
      title: 'Completed Product Goal',
      description: 'Successfully delivered',
      status: 'COMPLETED',
      targetDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      completedAt: new Date(),
      ...overrides,
    }),

    cancelledGoal: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      teamId: generateTestUUID(),
      title: 'Cancelled Product Goal',
      description: 'No longer relevant',
      status: 'CANCELLED',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      completedAt: null,
      ...overrides,
    }),
  },

  workflows: {
    validWorkflow: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      teamId: generateTestUUID(),
      name: 'Default Workflow',
      description: 'Standard workflow for backlog items',
      entityType: 'BacklogItem',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      states: [],
      transitions: [],
      ...overrides,
    }),
  },

  consents: {
    validConsent: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      userId: generateTestUUID(),
      consentVersionId: generateTestUUID(),
      consentedAt: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      isWithdrawn: false,
      withdrawnAt: null,
      withdrawalReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      consentVersion: null,
      ...overrides,
    }),

    withdrawnConsent: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      userId: generateTestUUID(),
      consentVersionId: generateTestUUID(),
      consentedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      isWithdrawn: true,
      withdrawnAt: new Date(),
      withdrawalReason: 'No longer interested',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      consentVersion: null,
      ...overrides,
    }),

    validConsentVersion: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      type: 'TERMS_OF_SERVICE',
      version: '1.0.0',
      content: 'Terms of service content...',
      effectiveDate: new Date(),
      isActive: true,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),
  },

  impediments: {
    activeImpediment: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      teamId: generateTestUUID(),
      sprintId: null,
      title: 'Blocked by external API',
      description: 'Waiting for third-party API access',
      priority: 'HIGH',
      status: 'ACTIVE',
      reporterId: generateTestUUID(),
      assigneeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      resolvedAt: null,
      resolution: null,
      reporter: null,
      assignee: null,
      ...overrides,
    }),

    resolvedImpediment: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      teamId: generateTestUUID(),
      sprintId: generateTestUUID(),
      title: 'Resolved Impediment',
      description: 'Issue has been fixed',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      reporterId: generateTestUUID(),
      assigneeId: generateTestUUID(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      resolvedAt: new Date(),
      resolution: 'External team provided access',
      reporter: null,
      assignee: null,
      ...overrides,
    }),
  },

  retrospectives: {
    wentWellItem: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      sprintId: generateTestUUID(),
      category: 'WENT_WELL',
      content: 'Great team collaboration',
      votes: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: generateTestUUID(),
      updatedBy: null,
      _count: { votes: 5 },
      ...overrides,
    }),

    toImproveItem: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      sprintId: generateTestUUID(),
      category: 'TO_IMPROVE',
      content: 'Need better estimation',
      votes: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: generateTestUUID(),
      updatedBy: null,
      _count: { votes: 3 },
      ...overrides,
    }),

    actionItem: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      sprintId: generateTestUUID(),
      description: 'Implement code review process',
      status: 'PENDING',
      assigneeId: generateTestUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: generateTestUUID(),
      updatedBy: null,
      completedAt: null,
      assignee: null,
      ...overrides,
    }),

    completedActionItem: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      sprintId: generateTestUUID(),
      description: 'Set up CI/CD pipeline',
      status: 'COMPLETED',
      assigneeId: generateTestUUID(),
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      createdBy: generateTestUUID(),
      updatedBy: null,
      completedAt: new Date(),
      assignee: null,
      ...overrides,
    }),
  },

  dailyUpdates: {
    validUpdate: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      sprintId: generateTestUUID(),
      userId: generateTestUUID(),
      date: new Date(),
      yesterday: 'Completed API integration',
      today: 'Working on frontend components',
      blockers: ['Waiting for design approval'],
      createdAt: new Date(),
      updatedAt: new Date(),
      user: null,
      ...overrides,
    }),

    noBlockersUpdate: (overrides: Record<string, unknown> = {}) => ({
      id: generateTestUUID(),
      sprintId: generateTestUUID(),
      userId: generateTestUUID(),
      date: new Date(),
      yesterday: 'Fixed bugs',
      today: 'Writing tests',
      blockers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      user: null,
      ...overrides,
    }),
  },

  auth: {
    validRegistration: () => ({
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
      firstName: 'New',
      lastName: 'User',
      termsAccepted: true as const,
      marketingOptIn: false,
    }),

    weakPasswordRegistration: () => ({
      email: 'weakpass@example.com',
      password: 'weak',
      firstName: 'Weak',
      lastName: 'Password',
    }),

    validLogin: () => ({
      email: 'test@example.com',
      password: 'TestPassword123!',
    }),

    invalidLogin: () => ({
      email: 'test@example.com',
      password: 'WrongPassword123!',
    }),
  },

  validations: {
    validEmails: [
      'test@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user123@test-domain.org',
    ],

    invalidEmails: [
      'invalid',
      'invalid@',
      '@example.com',
      'user@.com',
      'user@example',
      'user @example.com',
    ],

    strongPasswords: ['StrongPassword123!', 'Another$tr0ngP@ss', 'C0mpl3x!Pass#'],

    weakPasswords: [
      'short',
      'noNumbers!',
      'NoSpecialChars123',
      'nouppercase123!',
      'NOLOWERCASE123!',
    ],
  },
};

export type FixtureUsers = typeof fixtures.users;
export type FixtureTeams = typeof fixtures.teams;
export type FixtureSprints = typeof fixtures.sprints;
export type FixtureTasks = typeof fixtures.tasks;
export type FixturePBIs = typeof fixtures.pbis;
export type FixtureTokens = typeof fixtures.tokens;
export type FixtureNotifications = typeof fixtures.notifications;
export type FixtureGoals = typeof fixtures.goals;
export type FixtureWorkflows = typeof fixtures.workflows;
export type FixtureConsents = typeof fixtures.consents;
export type FixtureImpediments = typeof fixtures.impediments;
export type FixtureRetrospectives = typeof fixtures.retrospectives;
export type FixtureDailyUpdates = typeof fixtures.dailyUpdates;
export type FixtureAuth = typeof fixtures.auth;
export type FixtureValidations = typeof fixtures.validations;
