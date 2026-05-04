// Mock Data for Prototype Demo - temporarily simplified to fix compilation errors

import {
  MoSCoWPriority,
  type ItemStatus,
  type TaskStatus,
  type SprintStatus,
  type ImpedimentStatus,
  type UserRole,
  type User,
  type Team,
  type Sprint,
  type Task,
  type Impediment,
  type DailyUpdate,
  type BurndownData,
  type VelocityData,
  type ProductGoal,
  type ProductBacklogItem,
  type DefinitionOfDone,
} from '../types';
import { generateAvatarUrl } from '../utils/avatar';

// UUIDs matching backend seed data
export const UUIDS = {
  users: {
    admin: '018ff5b8-0e1a-7e8c-9d2f-4a6b8c3d5e7f',
    scrumMaster: '018ff5b8-0e1b-7e8c-9d2f-4a6b8c3d5e80',
    developer1: '018ff5b8-0e1c-7e8c-9d2f-4a6b8c3d5e81',
    developer2: '018ff5b8-0e1d-7e8c-9d2f-4a6b8c3d5e82',
    guest: '018ff5b8-0e1e-7e8c-9d2f-4a6b8c3d5e83',
    developer3: '018ff5b8-0e1f-7e8c-9d2f-4a6b8c3d5e84',
    productOwner2: '018ff5b8-0e20-7e8c-9d2f-4a6b8c3d5e85',
  },
  teams: {
    alpha: '018ff5b8-0e21-7e8c-9d2f-4a6b8c3d5e86',
    beta: '018ff5b8-0e22-7e8c-9d2f-4a6b8c3d5e87',
  },
};

// ==================== Users ====================
export const mockUsers: User[] = [
  {
    id: UUIDS.users.admin,
    email: 'admin@example.com',
    firstName: 'John',
    lastName: 'Administrator',
    avatarUrl: generateAvatarUrl('John'),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: UUIDS.users.scrumMaster,
    email: 'sarah.smith@example.com',
    firstName: 'Sarah',
    lastName: 'Smith',
    avatarUrl: generateAvatarUrl('sarah'),
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: UUIDS.users.developer1,
    email: 'mike.wilson@example.com',
    firstName: 'Mike',
    lastName: 'Wilson',
    avatarUrl: generateAvatarUrl('mike'),
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: UUIDS.users.developer2,
    email: 'emma.davis@example.com',
    firstName: 'Emma',
    lastName: 'Davis',
    avatarUrl: generateAvatarUrl('emma'),
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: UUIDS.users.guest,
    email: 'alex.brown@example.com',
    firstName: 'Alex',
    lastName: 'Brown',
    avatarUrl: generateAvatarUrl('alex'),
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: UUIDS.users.developer3,
    email: 'lisa.miller@example.com',
    firstName: 'Lisa',
    lastName: 'Miller',
    avatarUrl: generateAvatarUrl('lisa'),
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
  {
    id: UUIDS.users.productOwner2,
    email: 'david.taylor@example.com',
    firstName: 'David',
    lastName: 'Taylor',
    avatarUrl: generateAvatarUrl('david'),
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
  {
    id: '018ff5b8-0e23-7e8c-9d2f-4a6b8c3d5e88',
    email: 'sophia@example.com',
    firstName: 'Sophia',
    lastName: 'Anderson',
    avatarUrl: generateAvatarUrl('sophia'),
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
  },
  {
    id: '018ff5b8-0e24-7e8c-9d2f-4a6b8c3d5e89',
    email: 'robert@example.com',
    firstName: 'Robert',
    lastName: 'Clark',
    avatarUrl: generateAvatarUrl('robert'),
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'user-11',
    email: 'olivia@example.com',
    firstName: 'Olivia',
    lastName: 'White',
    avatarUrl: generateAvatarUrl('olivia'),
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'user-12',
    email: 'james@example.com',
    firstName: 'James',
    lastName: 'Harris',
    avatarUrl: generateAvatarUrl('james'),
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

// ==================== Definition of Done ====================
export const mockDefinitionOfDone: Record<string, DefinitionOfDone> = {
  'team-1': {
    id: 'dod-1',
    teamId: 'team-1',
    items: [
      {
        id: 'dod-1',
        description: 'Code is peer-reviewed and approved',
        category: 'review',
        isActive: true,
        order: 0,
      },
      {
        id: 'dod-2',
        description: 'Unit tests written and passing (minimum 80% coverage)',
        category: 'testing',
        isActive: true,
        order: 1,
      },
      {
        id: 'dod-3',
        description: 'Integration tests passing',
        category: 'testing',
        isActive: true,
        order: 2,
      },
      {
        id: 'dod-4',
        description: 'Code is properly documented',
        category: 'documentation',
        isActive: true,
        order: 3,
      },
      {
        id: 'dod-5',
        description: 'No critical or high-severity bugs',
        category: 'quality',
        isActive: true,
        order: 4,
      },
      {
        id: 'dod-6',
        description: 'Performance requirements met',
        category: 'quality',
        isActive: true,
        order: 5,
      },
      {
        id: 'dod-7',
        description: 'Security review completed',
        category: 'review',
        isActive: true,
        order: 6,
      },
      {
        id: 'dod-8',
        description: 'User acceptance testing passed',
        category: 'testing',
        isActive: true,
        order: 7,
      },
      {
        id: 'dod-9',
        description: 'Deployment documentation updated',
        category: 'documentation',
        isActive: true,
        order: 8,
      },
      {
        id: 'dod-10',
        description: 'Stakeholder approval received',
        category: 'review',
        isActive: true,
        order: 9,
      },
    ],
    version: 2,
    updatedBy: 'user-2',
    updatedAt: '2024-02-10T14:30:00Z',
  },
  'team-2': {
    id: 'dod-2',
    teamId: 'team-2',
    items: [
      {
        id: 'dod-11',
        description: 'Code review completed by at least 2 developers',
        category: 'review',
        isActive: true,
        order: 0,
      },
      {
        id: 'dod-12',
        description: 'All automated tests passing',
        category: 'testing',
        isActive: true,
        order: 1,
      },
      {
        id: 'dod-13',
        description: 'API documentation updated',
        category: 'documentation',
        isActive: true,
        order: 2,
      },
      {
        id: 'dod-14',
        description: 'Performance benchmarks met',
        category: 'quality',
        isActive: true,
        order: 3,
      },
      {
        id: 'dod-15',
        description: 'Accessibility requirements satisfied',
        category: 'quality',
        isActive: true,
        order: 4,
      },
    ],
    version: 1,
    updatedBy: 'user-6',
    updatedAt: '2024-02-01T09:15:00Z',
  },
};

// ==================== Teams ====================
export const mockTeams: Team[] = [
  {
    id: UUIDS.teams.alpha,
    name: 'Alpha Team',
    description: 'Main development team for the Agile Scrum Tracker project',
    createdBy: UUIDS.users.scrumMaster,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    members: [
      {
        id: '018ff5b8-0e25-7e8c-9d2f-4a6b8c3d5e8a',
        teamId: UUIDS.teams.alpha,
        userId: UUIDS.users.scrumMaster,
        role: 'scrum_master' as UserRole,
        joinedAt: '2024-01-01T00:00:00Z',
        user: mockUsers[1]!,
      },
      {
        id: '018ff5b8-0e26-7e8c-9d2f-4a6b8c3d5e8b',
        teamId: UUIDS.teams.alpha,
        userId: UUIDS.users.developer1,
        role: 'product_owner' as UserRole,
        joinedAt: '2024-01-01T00:00:00Z',
        user: mockUsers[2]!,
      },
      {
        id: '018ff5b8-0e27-7e8c-9d2f-4a6b8c3d5e8c',
        teamId: UUIDS.teams.alpha,
        userId: UUIDS.users.admin,
        role: 'developer' as UserRole,
        joinedAt: '2024-01-02T00:00:00Z',
        user: mockUsers[0]!,
      },
      {
        id: '018ff5b8-0e28-7e8c-9d2f-4a6b8c3d5e8d',
        teamId: UUIDS.teams.alpha,
        userId: UUIDS.users.developer2,
        role: 'developer' as UserRole,
        joinedAt: '2024-01-02T00:00:00Z',
        user: mockUsers[3]!,
      },
      {
        id: '018ff5b8-0e29-7e8c-9d2f-4a6b8c3d5e8e',
        teamId: UUIDS.teams.alpha,
        userId: UUIDS.users.guest,
        role: 'developer' as UserRole,
        joinedAt: '2024-01-03T00:00:00Z',
        user: mockUsers[4]!,
      },
    ],
  },
  {
    id: UUIDS.teams.beta,
    name: 'Beta Team',
    description: 'Mobile development team working on iOS and Android apps',
    createdBy: UUIDS.users.developer3,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    members: [
      {
        id: '018ff5b8-0e2a-7e8c-9d2f-4a6b8c3d5e8f',
        teamId: UUIDS.teams.beta,
        userId: UUIDS.users.developer3,
        role: 'scrum_master' as UserRole,
        joinedAt: '2024-01-15T00:00:00Z',
        user: mockUsers[5]!,
      },
      {
        id: '018ff5b8-0e2b-7e8c-9d2f-4a6b8c3d5e90',
        teamId: UUIDS.teams.beta,
        userId: UUIDS.users.productOwner2,
        role: 'product_owner' as UserRole,
        joinedAt: '2024-01-15T00:00:00Z',
        user: mockUsers[6]!,
      },
      {
        id: '018ff5b8-0e2c-7e8c-9d2f-4a6b8c3d5e91',
        teamId: UUIDS.teams.beta,
        userId: '018ff5b8-0e23-7e8c-9d2f-4a6b8c3d5e88',
        role: 'developer' as UserRole,
        joinedAt: '2024-01-16T00:00:00Z',
        user: mockUsers[7]!,
      },
      {
        id: '018ff5b8-0e2d-7e8c-9d2f-4a6b8c3d5e92',
        teamId: UUIDS.teams.beta,
        userId: '018ff5b8-0e24-7e8c-9d2f-4a6b8c3d5e89',
        role: 'developer' as UserRole,
        joinedAt: '2024-01-20T00:00:00Z',
        user: mockUsers[8]!,
      },
    ],
  },
  {
    id: '018ff5b8-0e30-7e8c-9d2f-4a6b8c3d5e93',
    name: 'Gamma Team',
    description: 'Quality assurance and testing team',
    createdBy: 'user-10',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    members: [
      {
        id: 'member-10',
        teamId: 'team-3',
        userId: 'user-10',
        role: 'scrum_master' as UserRole,
        joinedAt: '2024-02-01T00:00:00Z',
        user: mockUsers[9]!,
      },
      {
        id: 'member-11',
        teamId: 'team-3',
        userId: 'user-11',
        role: 'product_owner' as UserRole,
        joinedAt: '2024-02-01T00:00:00Z',
        user: mockUsers[10]!,
      },
      {
        id: 'member-12',
        teamId: 'team-3',
        userId: 'user-12',
        role: 'developer' as UserRole,
        joinedAt: '2024-02-01T00:00:00Z',
        user: mockUsers[11]!,
      },
    ],
  },
];

// ==================== Product Goals ====================
export const mockProductGoals: ProductGoal[] = [
  {
    id: 'goal-1',
    teamId: 'team-1',
    title: 'MVP Release',
    description: 'Deliver the minimum viable product with core Scrum tracking features',
    status: 'ACTIVE',
    targetDate: '2024-06-30T00:00:00Z',
    successMetrics: '100% of MVP features implemented, 80% test coverage',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'goal-2',
    teamId: 'team-1',
    title: 'User Adoption',
    description: 'Achieve significant user adoption and gather feedback',
    status: 'COMPLETED',
    targetDate: '2024-09-30T00:00:00Z',
    successMetrics: '1000 active users, 90% satisfaction rate',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

// ==================== Product Backlog Items ====================
export const mockProductBacklogItems: ProductBacklogItem[] = [
  // New Items
  {
    id: '019c6739-e4b1-75b7-9e35-0ad52076afc0',
    teamId: UUIDS.teams.alpha,
    goalId: '019c671c-10f8-70e9-8f31-9242bcb5e684',
    title: 'Implement real-time notifications',
    description:
      'Add WebSocket-based real-time notifications for task updates, mentions, and sprint events',
    priority: MoSCoWPriority.MUST_HAVE,
    storyPoints: 13,
    status: 'NEW' as ItemStatus,
    labels: ['backend', 'feature', 'notifications'],
    acceptanceCriteria:
      'Users receive instant notifications for:\n- Task assignments\n- @mentions\n- Sprint start/end\n- Impediment updates',
    createdBy: UUIDS.users.developer1,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '019c6739-e4b1-75b7-9e35-0ad52076afc1',
    teamId: UUIDS.teams.alpha,
    goalId: '019c671c-10f8-70e9-8f31-9242bcb5e684',
    title: 'Add burndown chart analytics',
    description: 'Enhance burndown charts with predictive analytics and trend analysis',
    priority: MoSCoWPriority.SHOULD_HAVE,
    storyPoints: 8,
    status: 'NEW' as ItemStatus,
    labels: ['frontend', 'analytics'],
    acceptanceCriteria:
      'Charts show:\n- Ideal vs actual burndown\n- Predicted completion\n- Historical trends',
    createdBy: UUIDS.users.scrumMaster,
    createdAt: '2024-02-02T00:00:00Z',
    updatedAt: '2024-02-02T00:00:00Z',
  },

  // Refined Items
  {
    id: 'pbi-003',
    teamId: 'team-1',
    goalId: 'goal-1',
    title: 'User authentication system',
    description:
      'Implement secure authentication with JWT tokens, password reset, and OAuth integration',
    priority: MoSCoWPriority.MUST_HAVE,
    storyPoints: 13,
    status: 'REFINED' as ItemStatus,
    labels: ['backend', 'security', 'authentication'],
    acceptanceCriteria:
      '- Email/password login\n- OAuth (Google, GitHub)\n- Password reset flow\n- Session management',
    createdBy: 'user-3',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'pbi-004',
    teamId: 'team-1',
    goalId: 'goal-1',
    title: 'Sprint planning workflow',
    description: 'Create intuitive sprint planning interface with drag-and-drop backlog items',
    priority: MoSCoWPriority.COULD_HAVE,
    storyPoints: 8,
    status: 'REFINED' as ItemStatus,
    labels: ['frontend', 'ux'],
    acceptanceCriteria:
      '- Drag items from backlog to sprint\n- Capacity planning\n- Velocity prediction\n- Sprint goal definition',
    createdBy: 'user-2',
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
  },

  // Ready Items
  {
    id: 'pbi-005',
    teamId: 'team-1',
    goalId: 'goal-1',
    title: 'Product backlog management',
    description: 'Full-featured product backlog with priorities, estimates, and filtering',
    priority: MoSCoWPriority.MUST_HAVE,
    storyPoints: 13,
    status: 'READY' as ItemStatus,
    labels: ['frontend', 'feature'],
    acceptanceCriteria:
      '- Create/edit/delete items\n- Prioritize with drag-and-drop\n- Filter by status, labels\n- Search functionality',
    createdBy: 'user-3',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z',
    creator: mockUsers[2],
  },
  {
    id: 'pbi-006',
    teamId: 'team-1',
    goalId: 'goal-1',
    title: 'Team management dashboard',
    description: 'Comprehensive team management with roles, permissions, and activity tracking',
    priority: MoSCoWPriority.WONT_HAVE,
    storyPoints: 8,
    status: 'READY' as ItemStatus,
    labels: ['frontend', 'admin'],
    acceptanceCriteria:
      '- Team member list\n- Role assignment\n- Activity timeline\n- Team metrics',
    createdBy: 'user-2',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-26T00:00:00Z',
  },

  // In Progress Items (in current sprint)
  {
    id: 'pbi-007',
    teamId: 'team-1',
    goalId: 'goal-1',
    title: 'Daily Scrum interface',
    description: 'Interface for team members to submit and view daily Scrum updates',
    priority: MoSCoWPriority.SHOULD_HAVE,
    storyPoints: 8,
    status: 'IN_PROGRESS' as ItemStatus,
    labels: ['frontend', 'feature'],
    acceptanceCriteria:
      '- Submit yesterday/today/impediments\n- View team updates\n- Historical updates\n- Notification reminders',
    createdBy: 'user-3',
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-02-05T00:00:00Z',
    creator: mockUsers[2],
  },
  {
    id: 'pbi-008',
    teamId: 'team-1',
    goalId: 'goal-1',
    title: 'Impediment tracking',
    description: 'Track and manage impediments with ownership, status, and resolution',
    priority: MoSCoWPriority.COULD_HAVE,
    storyPoints: 5,
    status: 'IN_PROGRESS' as ItemStatus,
    labels: ['frontend', 'feature', 'scrum-master'],
    acceptanceCriteria:
      '- Create impediments\n- Assign owner\n- Track status\n- Resolution workflow\n- Dashboard alerts',
    createdBy: 'user-2',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-02-05T00:00:00Z',
    creator: mockUsers[1],
  },

  // Done Items
  {
    id: 'pbi-009',
    teamId: 'team-1',
    goalId: 'goal-1',
    title: 'Sprint board with Kanban view',
    description: 'Interactive Kanban board for active sprint task management',
    priority: MoSCoWPriority.MUST_HAVE,
    storyPoints: 13,
    status: 'DONE' as ItemStatus,
    labels: ['frontend', 'feature'],
    acceptanceCriteria:
      '- Three columns: To Do, In Progress, Done\n- Drag-and-drop tasks\n- Task details modal\n- Quick actions',
    createdBy: 'user-3',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-02-03T00:00:00Z',
    creator: mockUsers[2],
  },
  {
    id: 'pbi-010',
    teamId: 'team-1',
    goalId: 'goal-1',
    title: 'Dashboard with sprint overview',
    description: 'Main dashboard showing sprint progress, burndown chart, and key metrics',
    priority: MoSCoWPriority.MUST_HAVE,
    storyPoints: 13,
    status: 'DONE' as ItemStatus,
    labels: ['frontend', 'feature'],
    acceptanceCriteria:
      '- Sprint summary cards\n- Burndown chart\n- My tasks widget\n- Quick actions\n- Team updates',
    createdBy: 'user-3',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    creator: mockUsers[2],
  },
  {
    id: 'pbi-011',
    teamId: 'team-1',
    goalId: 'goal-1',
    title: 'Responsive design',
    description: 'Ensure all pages are fully responsive and work on mobile devices',
    priority: MoSCoWPriority.WONT_HAVE,
    storyPoints: 5,
    status: 'DONE' as ItemStatus,
    labels: ['frontend', 'ux', 'mobile'],
    acceptanceCriteria:
      '- Mobile-first approach\n- Tablet optimization\n- Touch-friendly interactions\n- Consistent across devices',
    createdBy: 'user-2',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-02-04T00:00:00Z',
    creator: mockUsers[1],
  },
];

// ==================== Sprints ====================
export const mockSprints: Sprint[] = [
  // Completed Sprints
  {
    id: 'sprint-1',
    teamId: 'team-1',
    name: 'Sprint-2601 (2026/01/05-2026/01/16)',
    startDate: '2026-01-05T00:00:00Z',
    endDate: '2026-01-18T00:00:00Z',
    sprintGoal: 'Set up project infrastructure and core UI components',
    status: 'completed' as SprintStatus,
    createdAt: '2024-01-14T00:00:00Z',
    updatedAt: '2024-01-28T00:00:00Z',
    items: [mockProductBacklogItems[9]!],
    tasks: [],
  },
  {
    id: 'sprint-2',
    teamId: 'team-1',
    name: 'Sprint-2602 (2026/01/19-2026/01/30)',
    startDate: '2026-01-19T00:00:00Z',
    endDate: '2026-02-01T00:00:00Z',
    sprintGoal: 'Deliver sprint board and dashboard functionality',
    status: 'completed' as SprintStatus,
    createdAt: '2024-01-28T00:00:00Z',
    updatedAt: '2024-02-11T00:00:00Z',
    items: [mockProductBacklogItems[8]!, mockProductBacklogItems[10]!],
    tasks: [],
  },
  // Planned Sprint (ready to be started)
  {
    id: 'sprint-3',
    teamId: 'team-1',
    name: 'Sprint-2603 (2026/02/02-2026/02/13)',
    startDate: '2026-02-02T00:00:00Z',
    endDate: '2026-02-15T00:00:00Z',
    sprintGoal:
      'Complete daily Scrum and impediment tracking features to improve team collaboration',
    status: 'planned' as SprintStatus,
    createdAt: '2024-02-11T00:00:00Z',
    updatedAt: '2024-02-12T00:00:00Z',
    items: [mockProductBacklogItems[6]!, mockProductBacklogItems[7]!],
    tasks: [],
  },
];

// ==================== Tasks ====================
export const mockTasks: Task[] = [
  // Tasks for Sprint 3 - PBI-007 (Daily Scrum interface)
  {
    id: 'task-001',
    sprintId: 'sprint-3',
    pbiId: 'pbi-007',
    title: 'Design daily Scrum form UI',
    description: 'Create wireframes and implement form layout for daily updates',
    assigneeId: 'user-1',
    status: 'DONE' as TaskStatus,
    estimatedHours: 4,
    remainingHours: 0,
    createdAt: '2024-02-12T00:00:00Z',
    updatedAt: '2024-02-13T00:00:00Z',
    assignee: mockUsers[0],
  },
  {
    id: 'task-002',
    sprintId: 'sprint-3',
    pbiId: 'pbi-007',
    title: 'Implement form validation',
    description: 'Add client-side validation for daily Scrum form',
    assigneeId: 'user-4',
    status: 'DONE' as TaskStatus,
    estimatedHours: 3,
    remainingHours: 0,
    createdAt: '2024-02-12T00:00:00Z',
    updatedAt: '2024-02-14T00:00:00Z',
    assignee: mockUsers[3],
  },
  {
    id: 'task-003',
    sprintId: 'sprint-3',
    pbiId: 'pbi-007',
    title: 'Create team updates view',
    description: 'Build component to display all team member updates for a day',
    assigneeId: 'user-1',
    status: 'IN_PROGRESS' as TaskStatus,
    estimatedHours: 6,
    remainingHours: 3,
    createdAt: '2024-02-13T00:00:00Z',
    updatedAt: '2024-02-14T00:00:00Z',
    assignee: mockUsers[0],
  },
  {
    id: 'task-004',
    sprintId: 'sprint-3',
    pbiId: 'pbi-007',
    title: 'Add historical updates feature',
    description: 'Implement ability to view past daily Scrum updates',
    assigneeId: 'user-5',
    status: 'TODO' as TaskStatus,
    estimatedHours: 5,
    remainingHours: 5,
    createdAt: '2024-02-14T00:00:00Z',
    updatedAt: '2024-02-14T00:00:00Z',
    assignee: mockUsers[4],
  },

  // Tasks for Sprint 3 - PBI-008 (Impediment tracking)
  {
    id: 'task-005',
    sprintId: 'sprint-3',
    pbiId: 'pbi-008',
    title: 'Design impediment card component',
    description: 'Create reusable impediment card with status indicator',
    assigneeId: 'user-4',
    status: 'IN_PROGRESS' as TaskStatus,
    estimatedHours: 3,
    remainingHours: 1,
    createdAt: '2024-02-12T00:00:00Z',
    updatedAt: '2024-02-14T00:00:00Z',
    assignee: mockUsers[3],
  },
  {
    id: 'task-006',
    sprintId: 'sprint-3',
    pbiId: 'pbi-008',
    title: 'Implement impediment CRUD operations',
    description: 'Build create, read, update, delete functionality for impediments',
    assigneeId: 'user-1',
    status: 'TODO' as TaskStatus,
    estimatedHours: 6,
    remainingHours: 6,
    createdAt: '2024-02-14T00:00:00Z',
    updatedAt: '2024-02-14T00:00:00Z',
    assignee: mockUsers[0],
  },
  {
    id: 'task-007',
    sprintId: 'sprint-3',
    pbiId: 'pbi-008',
    title: 'Add impediment status workflow',
    description: 'Implement status transitions and resolution workflow',
    assigneeId: 'user-5',
    status: 'TODO' as TaskStatus,
    estimatedHours: 4,
    remainingHours: 4,
    createdAt: '2024-02-14T00:00:00Z',
    updatedAt: '2024-02-14T00:00:00Z',
    assignee: mockUsers[4],
  },
];

// Update sprint with tasks
mockSprints[2]!.tasks = mockTasks;

// ==================== Impediments ====================
export const mockImpediments: Impediment[] = [
  {
    id: 'imp-001',
    teamId: 'team-1',
    sprintId: 'sprint-3',
    title: 'API documentation incomplete',
    description:
      'Backend API documentation is missing several endpoints, making integration difficult',
    reportedById: 'user-1',
    ownerId: 'user-2',
    status: 'IN_PROGRESS' as ImpedimentStatus,
    resolution: 'Working with backend team to complete documentation',
    createdAt: '2024-02-13T00:00:00Z',
    updatedAt: '2024-02-14T00:00:00Z',
    reportedBy: mockUsers[0],
    owner: mockUsers[1],
  },
  {
    id: 'imp-002',
    teamId: 'team-1',
    sprintId: 'sprint-3',
    title: 'Styling conflicts with CSS modules',
    description: 'Some CSS modules are conflicting with global styles, causing layout issues',
    reportedById: 'user-4',
    status: 'OPEN' as ImpedimentStatus,
    createdAt: '2024-02-14T00:00:00Z',
    updatedAt: '2024-02-14T00:00:00Z',
    reportedBy: mockUsers[3],
  },
  {
    id: 'imp-003',
    teamId: 'team-1',
    sprintId: 'sprint-2',
    title: 'Test environment down',
    description: 'CI/CD test environment was unavailable for 2 days',
    reportedById: 'user-5',
    ownerId: 'user-2',
    status: 'RESOLVED' as ImpedimentStatus,
    resolution: 'DevOps team fixed the issue, environment is now stable',
    createdAt: '2024-02-05T00:00:00Z',
    updatedAt: '2024-02-07T00:00:00Z',
    resolvedAt: '2024-02-07T00:00:00Z',
    reportedBy: mockUsers[4],
    owner: mockUsers[1],
  },
];

// ==================== Daily Updates ====================
// Comprehensive mock data for Daily Scrum demo - covers multiple days with all team members

// Today's date for realistic demo
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

const formatDate = (d: Date): string => d.toISOString().split('T')[0]!;
const formatTime = (h: number, m: number): string =>
  `${today.toISOString().split('T')[0]!}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00Z`;

export const mockDailyUpdates: DailyUpdate[] = [
  // ============ TODAY'S UPDATES ============
  {
    id: 'update-today-1',
    sprintId: 'sprint-3',
    userId: 'user-1',
    updateDate: formatDate(today),
    yesterdayWork:
      'Completed the task card UI improvements with drag-and-drop functionality. Fixed several styling issues in the Kanban board. Reviewed and merged 3 PRs.',
    todayWork:
      'Working on the Sprint Board statistics component. Implementing real-time progress tracking. Will pair with Emma on API integration.',
    impediment: 'None',
    createdAt: formatTime(9, 5),
    user: mockUsers[0],
  },
  {
    id: 'update-today-2',
    sprintId: 'sprint-3',
    userId: 'user-4',
    updateDate: formatDate(today),
    yesterdayWork:
      'Finished implementing the filter component for the backlog. Added support for multi-select filters. Wrote unit tests for filter logic.',
    todayWork:
      'Starting work on the sprint planning capacity visualization. Need to coordinate with Sarah on the design specs.',
    impediment:
      'Need design review from Sarah on capacity bar visualization - blocked until afternoon meeting.',
    createdAt: formatTime(9, 12),
    user: mockUsers[3],
  },
  {
    id: 'update-today-3',
    sprintId: 'sprint-3',
    userId: 'user-5',
    updateDate: formatDate(today),
    yesterdayWork:
      'Set up the mock API service layer for testing. Created comprehensive test data for sprint planning. Fixed 2 bugs in the task status update flow.',
    todayWork:
      'Implementing the burndown chart component with Chart.js. Will add interactive tooltips and zoom functionality.',
    impediment: 'None',
    createdAt: formatTime(9, 18),
    user: mockUsers[4],
  },
  {
    id: 'update-today-4',
    sprintId: 'sprint-3',
    userId: 'user-3',
    updateDate: formatDate(today),
    yesterdayWork:
      'Completed sprint goal definition for Sprint 4. Refined 5 new backlog items with the team. Updated product roadmap documentation.',
    todayWork:
      'Prioritizing new feature requests from stakeholders. Will prepare sprint demo presentation. Meeting with customers at 2pm.',
    impediment: 'None',
    createdAt: formatTime(9, 25),
    user: mockUsers[2],
  },

  // ============ YESTERDAY'S UPDATES ============
  {
    id: 'update-yest-1',
    sprintId: 'sprint-3',
    userId: 'user-1',
    updateDate: formatDate(yesterday),
    yesterdayWork:
      'Implemented the basic Kanban board layout. Created task card components. Set up the drag-and-drop infrastructure.',
    todayWork:
      'Complete Kanban board with drag-and-drop. Start working on task card UI improvements. Code review for filter component.',
    impediment: 'Waiting for UX mockups from design team - expected EOD.',
    createdAt: `${formatDate(yesterday)}T09:03:00Z`,
    user: mockUsers[0],
  },
  {
    id: 'update-yest-2',
    sprintId: 'sprint-3',
    userId: 'user-4',
    updateDate: formatDate(yesterday),
    yesterdayWork:
      'Built the backlog filter bar component. Added status and label filter options. Integrated with the product backlog page.',
    todayWork:
      'Add multi-select functionality to filters. Work on filter persistence. Start capacity planning UI.',
    impediment: 'None',
    createdAt: `${formatDate(yesterday)}T09:10:00Z`,
    user: mockUsers[3],
  },
  {
    id: 'update-yest-3',
    sprintId: 'sprint-3',
    userId: 'user-5',
    updateDate: formatDate(yesterday),
    yesterdayWork:
      'Created mock data generators for the demo. Set up testing infrastructure. Fixed issues with date formatting.',
    todayWork:
      'Expand mock data for daily scrum feature. Add more realistic test scenarios. Start burndown chart implementation.',
    impediment: 'Test environment occasionally slow - need DevOps support.',
    createdAt: `${formatDate(yesterday)}T09:22:00Z`,
    user: mockUsers[4],
  },
  {
    id: 'update-yest-4',
    sprintId: 'sprint-3',
    userId: 'user-2',
    updateDate: formatDate(yesterday),
    yesterdayWork:
      'Facilitated sprint planning meeting. Removed blockers for 2 team members. Updated sprint backlog priorities.',
    todayWork:
      'Prepare sprint review presentation. Follow up on impediments. Schedule retrospective for Friday.',
    impediment: 'One team member out sick - need to redistribute tasks.',
    createdAt: `${formatDate(yesterday)}T09:15:00Z`,
    user: mockUsers[1],
  },
  {
    id: 'update-yest-5',
    sprintId: 'sprint-3',
    userId: 'user-3',
    updateDate: formatDate(yesterday),
    yesterdayWork:
      'Refined backlog items with development team. Created acceptance criteria for 3 user stories. Updated sprint goal.',
    todayWork:
      'Continue backlog refinement session. Work with stakeholders on feature priorities. Prepare demo for executives.',
    impediment: 'None',
    createdAt: `${formatDate(yesterday)}T09:30:00Z`,
    user: mockUsers[2],
  },

  // ============ TWO DAYS AGO UPDATES ============
  {
    id: 'update-2days-1',
    sprintId: 'sprint-3',
    userId: 'user-1',
    updateDate: formatDate(twoDaysAgo),
    yesterdayWork:
      'Set up the sprint planning page structure. Created basic layout components. Started Kanban board wireframe.',
    todayWork:
      'Implement Kanban board columns and task cards. Add basic styling. Plan drag-and-drop implementation.',
    impediment: 'None',
    createdAt: `${formatDate(twoDaysAgo)}T09:02:00Z`,
    user: mockUsers[0],
  },
  {
    id: 'update-2days-2',
    sprintId: 'sprint-3',
    userId: 'user-4',
    updateDate: formatDate(twoDaysAgo),
    yesterdayWork:
      'Implemented product backlog item cards. Added priority badge and status indicators. Set up filtering infrastructure.',
    todayWork:
      'Build filter bar component. Implement status and label filters. Add search functionality.',
    impediment: 'None',
    createdAt: `${formatDate(twoDaysAgo)}T09:08:00Z`,
    user: mockUsers[3],
  },
  {
    id: 'update-2days-3',
    sprintId: 'sprint-3',
    userId: 'user-5',
    updateDate: formatDate(twoDaysAgo),
    yesterdayWork:
      'Configured testing framework with Jest and React Testing Library. Wrote initial test cases for core components.',
    todayWork:
      'Expand test coverage to 70%. Create mock data generators. Fix failing tests from latest PR.',
    impediment: 'CI/CD pipeline failing on specific test - investigating.',
    createdAt: `${formatDate(twoDaysAgo)}T09:20:00Z`,
    user: mockUsers[4],
  },
  {
    id: 'update-2days-4',
    sprintId: 'sprint-3',
    userId: 'user-2',
    updateDate: formatDate(twoDaysAgo),
    yesterdayWork:
      'Kicked off Sprint 3 planning session. Defined sprint goal with team. Assigned sprint backlog items.',
    todayWork:
      'Monitor sprint progress. Address any blockers. Prepare for backlog refinement session.',
    impediment: 'None',
    createdAt: `${formatDate(twoDaysAgo)}T09:00:00Z`,
    user: mockUsers[1],
  },
  {
    id: 'update-2days-5',
    sprintId: 'sprint-3',
    userId: 'user-3',
    updateDate: formatDate(twoDaysAgo),
    yesterdayWork:
      'Presented sprint goals to stakeholders. Gathered feedback on MVP features. Prioritized backlog items.',
    todayWork:
      'Create detailed acceptance criteria for high-priority items. Schedule refinement session with developers.',
    impediment: 'Stakeholder requested urgent feature - need to assess impact on sprint.',
    createdAt: `${formatDate(twoDaysAgo)}T09:35:00Z`,
    user: mockUsers[2],
  },

  // ============ HISTORICAL DATA FROM PREVIOUS DATES ============
  {
    id: 'update-001',
    sprintId: 'sprint-3',
    userId: 'user-1',
    updateDate: '2024-02-12',
    yesterdayWork: 'Completed daily Scrum form UI design. Started implementing team updates view.',
    todayWork: 'Continue working on team updates view component. Start integrating with mock data.',
    impediment: 'Waiting for design review from Sarah.',
    createdAt: '2024-02-12T09:00:00Z',
    user: mockUsers[0],
  },
  {
    id: 'update-002',
    sprintId: 'sprint-3',
    userId: 'user-4',
    updateDate: '2024-02-12',
    yesterdayWork:
      'Implemented form validation with error messages. Started impediment card design.',
    todayWork: 'Finish impediment card component. Test form validation edge cases.',
    impediment: 'None',
    createdAt: '2024-02-12T09:15:00Z',
    user: mockUsers[3],
  },
  {
    id: 'update-003',
    sprintId: 'sprint-3',
    userId: 'user-5',
    updateDate: '2024-02-12',
    yesterdayWork:
      'Set up test environment for daily Scrum feature. Wrote unit tests for form component.',
    todayWork: 'Start working on historical updates feature. Create mock data for testing.',
    impediment: 'None',
    createdAt: '2024-02-12T09:30:00Z',
    user: mockUsers[4],
  },
  {
    id: 'update-004',
    sprintId: 'sprint-3',
    userId: 'user-1',
    updateDate: '2024-02-13',
    yesterdayWork: 'Finished team updates view component. Started integrating with API service.',
    todayWork: 'Complete API integration. Start working on impediment CRUD operations.',
    impediment: 'API documentation incomplete - need to clarify some endpoints.',
    createdAt: '2024-02-13T09:00:00Z',
    user: mockUsers[0],
  },
  {
    id: 'update-005',
    sprintId: 'sprint-3',
    userId: 'user-4',
    updateDate: '2024-02-13',
    yesterdayWork: 'Completed impediment card design. Started implementing card interactions.',
    todayWork: 'Finish card interactions. Fix CSS styling conflicts.',
    impediment: 'CSS module conflicts causing layout issues.',
    createdAt: '2024-02-13T09:15:00Z',
    user: mockUsers[3],
  },
];

// ==================== Burndown Data ====================
export const mockBurndownData: BurndownData[] = [
  // Sprint 3 burndown (Day 0-14)
  { date: '2024-02-12', ideal: 34, actual: 34 },
  { date: '2024-02-13', ideal: 31.57, actual: 32 },
  { date: '2024-02-14', ideal: 29.14, actual: 29 },
  { date: '2024-02-15', ideal: 26.71, actual: 27 },
  { date: '2024-02-16', ideal: 24.28, actual: 0 },
  { date: '2024-02-17', ideal: 21.85, actual: 0 },
  { date: '2024-02-18', ideal: 19.42, actual: 0 },
  { date: '2024-02-19', ideal: 16.99, actual: 0 },
  { date: '2024-02-20', ideal: 14.56, actual: 0 },
  { date: '2024-02-21', ideal: 12.13, actual: 0 },
  { date: '2024-02-22', ideal: 9.7, actual: 0 },
  { date: '2024-02-23', ideal: 7.27, actual: 0 },
  { date: '2024-02-24', ideal: 4.84, actual: 0 },
  { date: '2024-02-25', ideal: 2.41, actual: 0 },
  { date: '2024-02-26', ideal: 0, actual: 0 },
];

// ==================== Velocity Data ====================
export const mockVelocityData: VelocityData[] = [
  {
    sprintNumber: 1,
    sprintName: 'Sprint-2601 (2026/01/05-2026/01/16)',
    planned: 13,
    completed: 13,
  },
  {
    sprintNumber: 2,
    sprintName: 'Sprint-2602 (2026/01/19-2026/01/30)',
    planned: 18,
    completed: 18,
  },
  { sprintNumber: 3, sprintName: 'Sprint-2603 (2026/02/02-2026/02/13)', planned: 13, completed: 0 },
];

// Helper function to get current user
export const getCurrentUser = (): User => mockUsers[0]!;

// Helper function to get current team
export const getCurrentTeam = (): Team => mockTeams[0]!;

// Helper function to get active sprint
export const getActiveSprint = (): Sprint | undefined =>
  mockSprints.find((s) => s.status === 'active');
