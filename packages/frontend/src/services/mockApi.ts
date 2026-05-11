// Mock API Service for Prototype Demo
// This service returns mock data instead of making real API calls

import {
  RetrospectiveCategory,
  IncrementStatus,
  DeliveryMethod,
  ItemStatus,
  TaskStatus,
  SprintStatus,
  ImpedimentStatus,
  MoSCoWPriority,
  RetrospectiveStatus,
  type UserRole,
  type ApiResponse,
  type PaginatedResponse,
  type LoginCredentials,
  type RegisterData,
  type AuthTokens,
  type User,
  type Team,
  type TeamMember,
  type ProductBacklogItem,
  type Sprint,
  type Task,
  type Impediment,
  type DailyUpdate,
  type ProductGoal,
  type SprintConfiguration,
  type SprintDuration,
  type GeneratedSprint,
  type SprintGenerationResult,
  type SystemParameter,
  type Increment,
  type SprintReview,
  type SprintRetrospective,
  type DefinitionOfDone,
  type DoDItem,
  type DoDChecklistVerification,
  type DoDComplianceReport,
  type DefinitionOfReady,
  type DoRItem,
  type DoRChecklistVerification,
  type StakeholderFeedback,
  type BacklogAdjustment,
  type RetroActionItem,
  type RetrospectiveItem,
  type IncrementMetrics,
  type SprintHistoryItem,
  type TeamMetrics,
  type Insight,
  type ReviewAttendee,
  type RetroAttendee,
  type StatusChangeHistoryItem,
  type SessionInfo,
  type SprintBacklogItem,
  type BacklogChange,
  type Notification as AppNotification,
  type ConsentRecord,
  type WorkflowState,
  type WorkflowTransition,
} from '../types';

import { mockSuccess, mockError, mockDelay } from './mockResponseUtils';
import {
  mockUsers,
  mockTeams,
  mockProductBacklogItems,
  mockSprints,
  mockTasks,
  mockImpediments,
  mockDailyUpdates,
  mockBurndownData,
  mockVelocityData,
  mockProductGoals,
  mockDefinitionOfDone,
  getCurrentUser,
  getCurrentTeam,
} from './mockData';

const generateUUID = () => crypto.randomUUID();

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const getMockSessionInfo = (): SessionInfo => ({
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  idleTimeoutMs: 30 * 60 * 1000,
  absoluteTimeoutMs: 24 * 60 * 60 * 1000,
  warningThresholdMs: 2 * 60 * 1000,
});

class MockApiService {
  private consentStore: ConsentRecord[] = [];

  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens; sessionInfo: SessionInfo }>> {
    await delay(500);

    const user = mockUsers.find((u) => u.email === credentials.email);
    if (!user) {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      };
    }

    return {
      success: true,
      data: {
        user,
        tokens: {
          accessToken: `mock-access-token-${Date.now()}`,
          refreshToken: `mock-refresh-token-${Date.now()}`,
        },
        sessionInfo: getMockSessionInfo(),
      },
    };
  }

  async register(
    userData: RegisterData
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens; sessionInfo: SessionInfo }>> {
    await delay(500);

    const existingUser = mockUsers.find((u) => u.email === userData.email);
    if (existingUser) {
      return {
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered',
        },
      };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: {
        user: newUser,
        tokens: {
          accessToken: `mock-access-token-${Date.now()}`,
          refreshToken: `mock-refresh-token-${Date.now()}`,
        },
        sessionInfo: getMockSessionInfo(),
      },
    };
  }

  async logout(): Promise<ApiResponse<never>> {
    await delay(200);
    return { success: true };
  }

  async logoutAllSessions(): Promise<ApiResponse<{ message: string }>> {
    await delay(200);
    return { success: true, data: { message: 'All sessions logged out' } };
  }

  async updateActivity(): Promise<ApiResponse<{ message: string }>> {
    await delay(100);
    return { success: true, data: { message: 'Activity updated' } };
  }

  async checkDeletionEligibility(): Promise<
    ApiResponse<{
      canDelete: boolean;
      teams: Array<{ id: string; name: string; role: string; isLastPO: boolean }>;
      blockedReason: string | null;
    }>
  > {
    await delay(200);
    return {
      success: true,
      data: {
        canDelete: true,
        teams: [],
        blockedReason: null,
      },
    };
  }

  async deleteAccount(_confirmation: string): Promise<ApiResponse<void>> {
    await delay(300);
    return { success: true };
  }

  async getActiveSessions(): Promise<
    ApiResponse<
      Array<{
        id: string;
        createdAt: string;
        lastActivityAt: string;
        expiresAt: string;
        userAgent: string | null;
        ipAddress: string | null;
      }>
    >
  > {
    await delay(200);
    return {
      success: true,
      data: [
        {
          id: 'session-1',
          createdAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          userAgent: navigator.userAgent,
          ipAddress: '127.0.0.1',
        },
      ],
    };
  }

  async revokeSession(_tokenId: string): Promise<ApiResponse<{ message: string }>> {
    await delay(200);
    return { success: true, data: { message: 'Session revoked' } };
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    await delay(200);
    return {
      success: true,
      data: getCurrentUser(),
    };
  }

  // ==================== Teams ====================
  async getTeams(): Promise<ApiResponse<Team[]>> {
    await delay(300);
    return {
      success: true,
      data: mockTeams,
    };
  }

  async getTeam(id: string): Promise<ApiResponse<Team>> {
    await delay(300);
    const team = mockTeams.find((t) => t.id === id);
    if (!team) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Team not found',
        },
      };
    }
    return { success: true, data: team };
  }

  async createTeam(teamData: Partial<Team>): Promise<ApiResponse<Team>> {
    await delay(500);
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: teamData.name ?? 'New Team',
      description: teamData.description,
      createdBy: getCurrentUser().id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: newTeam };
  }

  async addTeamMember(
    _teamId: string,
    email: string,
    role: string
  ): Promise<ApiResponse<TeamMember>> {
    await delay(400);
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      };
    }
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      teamId: _teamId,
      userId: user.id,
      role: role as UserRole,
      joinedAt: new Date().toISOString(),
      user,
    };
    return { success: true, data: newMember };
  }

  async removeTeamMember(_teamId: string, _memberId: string): Promise<ApiResponse<never>> {
    await delay(300);
    return { success: true };
  }

  // ==================== Product Backlog ====================
  async getProductBacklog(
    teamId: string,
    params?: { status?: string; labels?: string; page?: number; limit?: number }
  ): Promise<PaginatedResponse<ProductBacklogItem>> {
    await delay(400);

    let items = mockProductBacklogItems.filter((item) => item.teamId === teamId);

    // Apply filters
    if (params?.status) {
      items = items.filter((item) => item.status === params.status);
    }

    if (params?.labels) {
      const labels = params.labels.split(',');
      items = items.filter((item) => labels.some((label) => item.labels.includes(label)));
    }

    // Apply pagination
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
      },
    };
  }

  async createProductBacklogItem(
    item: Partial<ProductBacklogItem>
  ): Promise<ApiResponse<ProductBacklogItem>> {
    await delay(500);

    const newItem: ProductBacklogItem = {
      id: `pbi-${Date.now()}`,
      teamId: item.teamId ?? getCurrentTeam().id,
      title: item.title ?? 'New Item',
      description: item.description,
      priority: item.priority ?? MoSCoWPriority.COULD_HAVE,
      storyPoints: item.storyPoints,
      businessValue: item.businessValue,
      status: item.status ?? ItemStatus.NEW,
      labels: item.labels ?? [],
      acceptanceCriteria: item.acceptanceCriteria,
      goalId: item.goalId,
      createdBy: getCurrentUser().id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockProductBacklogItems.push(newItem);

    return { success: true, data: newItem };
  }

  async updateProductBacklogItem(
    id: string,
    updates: Partial<ProductBacklogItem>
  ): Promise<ApiResponse<ProductBacklogItem>> {
    await delay(400);

    const itemIndex = mockProductBacklogItems.findIndex((item) => item.id === id);
    if (itemIndex === -1) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found',
        },
      };
    }

    const updatedItem = {
      ...(mockProductBacklogItems[itemIndex] as ProductBacklogItem),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    mockProductBacklogItems[itemIndex] = updatedItem;

    return { success: true, data: updatedItem };
  }

  async updateBacklogItemPriority(
    id: string,
    priority: MoSCoWPriority
  ): Promise<ApiResponse<ProductBacklogItem>> {
    return this.updateProductBacklogItem(id, { priority });
  }

  async deleteProductBacklogItem(_id: string): Promise<ApiResponse<never>> {
    await delay(300);
    return { success: true };
  }

  // ==================== Sprints ====================
  async getSprints(teamId: string): Promise<ApiResponse<Sprint[]>> {
    await delay(300);
    const sprints = mockSprints.filter((s) => s.teamId === teamId);
    return { success: true, data: sprints };
  }

  async getActiveSprint(teamId: string): Promise<ApiResponse<Sprint>> {
    await delay(300);
    const activeSprint = mockSprints.find(
      (s) => s.status === SprintStatus.ACTIVE && s.teamId === teamId
    );

    if (!activeSprint) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active sprint found',
        },
      };
    }

    const sprintTasks = mockTasks.filter((t) => t.sprintId === activeSprint.id);

    return {
      success: true,
      data: {
        ...activeSprint,
        tasks: sprintTasks,
        items: [],
      },
    };
  }

  async createSprint(sprint: Partial<Sprint>): Promise<ApiResponse<Sprint>> {
    await delay(500);

    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      teamId: sprint.teamId ?? getCurrentTeam().id,
      name: sprint.name ?? 'New Sprint',
      startDate: sprint.startDate ?? new Date().toISOString(),
      endDate: sprint.endDate ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      sprintGoal: sprint.sprintGoal,
      status: SprintStatus.PLANNED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: newSprint };
  }

  async getSprint(id: string): Promise<ApiResponse<Sprint>> {
    await delay(300);
    const sprint = mockSprints.find((s) => s.id === id);

    if (!sprint) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Sprint not found',
        },
      };
    }

    return { success: true, data: sprint };
  }

  async startSprint(
    id: string,
    data?: {
      backlogItems?: Array<{ pbiId: string }>;
      tasks?: Array<{
        pbiId: string;
        title: string;
        description?: string;
        assigneeId?: string;
        estimatedHours?: number;
        remainingHours?: number;
      }>;
    }
  ): Promise<ApiResponse<Sprint>> {
    await delay(500);

    const existingActiveSprint = mockSprints.find((s) => s.status === SprintStatus.ACTIVE);
    if (existingActiveSprint) {
      return {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Another sprint is already active',
        },
      };
    }

    const sprintIndex = mockSprints.findIndex((s) => s.id === id);

    if (sprintIndex === -1) {
      const generatedSprintIndex = this.generatedSprintsStore.findIndex((s) => s.id === id);

      if (generatedSprintIndex !== -1) {
        const generatedSprint = this.generatedSprintsStore[generatedSprintIndex] as GeneratedSprint;
        const newSprintId = generateUUID();
        const newSprint: Sprint = {
          id: newSprintId,
          teamId: generatedSprint.teamId,
          name: generatedSprint.name,
          startDate: generatedSprint.startDate,
          endDate: generatedSprint.endDate,
          sprintGoal: generatedSprint.sprintGoal,
          status: SprintStatus.ACTIVE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        mockSprints.push(newSprint);
        this.generatedSprintsStore[generatedSprintIndex] = {
          ...generatedSprint,
          status: SprintStatus.ACTIVE,
        };

        if (data?.backlogItems) {
          data.backlogItems.forEach((item) => {
            const pbiIndex = mockProductBacklogItems.findIndex((p) => p.id === item.pbiId);
            if (pbiIndex !== -1) {
              mockProductBacklogItems[pbiIndex] = {
                ...(mockProductBacklogItems[pbiIndex] as ProductBacklogItem),
                status: ItemStatus.IN_PROGRESS,
              };
            }
          });
        }

        if (data?.tasks) {
          data.tasks.forEach((task) => {
            mockTasks.push({
              id: generateUUID(),
              sprintId: newSprintId,
              pbiId: task.pbiId,
              title: task.title,
              description: task.description,
              assigneeId: task.assigneeId,
              status: TaskStatus.TODO,
              estimatedHours: task.estimatedHours,
              remainingHours: task.remainingHours ?? task.estimatedHours,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
        }

        return { success: true, data: newSprint };
      }

      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Sprint not found',
        },
      };
    }

    mockSprints[sprintIndex] = {
      ...(mockSprints[sprintIndex] as Sprint),
      status: SprintStatus.ACTIVE,
      updatedAt: new Date().toISOString(),
    };

    const activeSprintId = (mockSprints[sprintIndex] as Sprint).id;

    if (data?.backlogItems) {
      data.backlogItems.forEach((item) => {
        const pbiIndex = mockProductBacklogItems.findIndex((p) => p.id === item.pbiId);
        if (pbiIndex !== -1) {
          mockProductBacklogItems[pbiIndex] = {
            ...(mockProductBacklogItems[pbiIndex] as ProductBacklogItem),
            status: ItemStatus.IN_PROGRESS,
          };
        }
      });
    }

    if (data?.tasks) {
      data.tasks.forEach((task) => {
        mockTasks.push({
          id: generateUUID(),
          sprintId: activeSprintId,
          pbiId: task.pbiId,
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId,
          status: TaskStatus.TODO,
          estimatedHours: task.estimatedHours,
          remainingHours: task.remainingHours ?? task.estimatedHours,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    }

    return { success: true, data: mockSprints[sprintIndex] as Sprint };
  }

  async updateSprint(id: string, updates: Partial<Sprint>): Promise<ApiResponse<Sprint>> {
    await delay(400);

    const sprintIndex = mockSprints.findIndex((s) => s.id === id);

    if (sprintIndex === -1) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Sprint not found',
        },
      };
    }

    mockSprints[sprintIndex] = {
      ...(mockSprints[sprintIndex] as Sprint),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: mockSprints[sprintIndex] as Sprint };
  }

  async getBurndownData(
    _sprintId: string
  ): Promise<ApiResponse<{ dates: string[]; ideal: number[]; actual: number[] }>> {
    await delay(300);

    const dates = mockBurndownData.map((d) => d.date);
    const ideal = mockBurndownData.map((d) => d.ideal);
    const actual = mockBurndownData.map((d) => d.actual || 0);

    return {
      success: true,
      data: { dates, ideal, actual },
    };
  }

  // ==================== Tasks ====================
  async getSprintTasks(sprintId: string): Promise<ApiResponse<Task[]>> {
    await delay(300);
    const tasks = mockTasks.filter((t) => t.sprintId === sprintId);
    return { success: true, data: tasks };
  }

  async createTask(sprintId: string, task: Partial<Task>): Promise<ApiResponse<Task>> {
    await delay(400);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      sprintId,
      pbiId: task.pbiId ?? '',
      title: task.title ?? 'New Task',
      description: task.description,
      assigneeId: task.assigneeId,
      status: TaskStatus.TODO,
      estimatedHours: task.estimatedHours,
      remainingHours: task.remainingHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: newTask };
  }

  async updateTask(
    _sprintId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<ApiResponse<Task>> {
    await delay(300);

    const taskIndex = mockTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      };
    }

    const updatedTask = {
      ...(mockTasks[taskIndex] as Task),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: updatedTask };
  }

  async deleteTask(_sprintId: string, _taskId: string): Promise<ApiResponse<never>> {
    await delay(300);
    return { success: true };
  }

  async completeSprint(_sprintId: string): Promise<ApiResponse<Sprint>> {
    await delay(500);
    const activeSprint = mockSprints.find((s) => s.status === SprintStatus.ACTIVE);
    if (activeSprint) {
      activeSprint.status = SprintStatus.COMPLETED;
      activeSprint.updatedAt = new Date().toISOString();
    }
    return { success: true, data: activeSprint ?? (mockSprints[0] as Sprint) };
  }

  async getStatusChangeHistory(
    _entityType: string,
    _entityId: string,
    _limit?: number,
    _offset?: number
  ): Promise<ApiResponse<StatusChangeHistoryItem[]>> {
    await delay(300);
    return { success: true, data: [] };
  }

  async rollbackSprintStart(
    _sprintId: string,
    _rollbackData?: { reason: string }
  ): Promise<ApiResponse<Sprint>> {
    await delay(400);
    return { success: true, data: mockSprints[0] as Sprint };
  }

  async getSprintBacklogPBIs(_sprintId: string): Promise<ApiResponse<ProductBacklogItem[]>> {
    await delay(300);
    return {
      success: true,
      data: mockProductBacklogItems.filter((p) => p.status === ItemStatus.IN_PROGRESS),
    };
  }

  // ==================== Daily Updates ====================
  // Store for dynamically created updates during demo
  private dynamicDailyUpdates: DailyUpdate[] = [];

  async getDailyUpdates(sprintId: string, date?: string): Promise<ApiResponse<DailyUpdate[]>> {
    await delay(300);

    // Combine static mock data with dynamically created updates
    const allUpdates = [...mockDailyUpdates, ...this.dynamicDailyUpdates];
    let updates = allUpdates.filter((u) => u.sprintId === sprintId);

    if (date) {
      updates = updates.filter((u) => u.updateDate === date);
    }

    // Sort by creation time (most recent first)
    updates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: updates };
  }

  async createDailyUpdate(
    sprintId: string,
    update: Partial<DailyUpdate>
  ): Promise<ApiResponse<DailyUpdate>> {
    await delay(400);

    const currentUser = getCurrentUser();
    const today = new Date().toISOString().split('T')[0] ?? '';

    const newUpdate: DailyUpdate = {
      id: `update-${Date.now()}`,
      sprintId,
      userId: currentUser.id,
      updateDate: today,
      yesterdayWork: update.yesterdayWork ?? '',
      todayWork: update.todayWork ?? '',
      impediment: update.impediment,
      createdAt: new Date().toISOString(),
      user: currentUser,
    };

    // Store in dynamic updates
    this.dynamicDailyUpdates.push(newUpdate);

    return { success: true, data: newUpdate };
  }

  async getTeamMembersWithUpdates(
    sprintId: string,
    date: string
  ): Promise<
    ApiResponse<{
      submitted: DailyUpdate[];
      pending: { userId: string; userName: string }[];
    }>
  > {
    await delay(300);

    const team = getCurrentTeam();
    const allUpdates = [...mockDailyUpdates, ...this.dynamicDailyUpdates];
    const todayUpdates = allUpdates.filter((u) => u.sprintId === sprintId && u.updateDate === date);

    const submittedUserIds = new Set(todayUpdates.map((u) => u.userId));
    const pendingMembers = (team.members ?? [])
      .filter((m) => !submittedUserIds.has(m.userId))
      .map((m) => ({
        userId: m.userId,
        userName: `${m.user?.firstName ?? ''} ${m.user?.lastName ?? ''}`.trim(),
      }));

    return {
      success: true,
      data: {
        submitted: todayUpdates,
        pending: pendingMembers,
      },
    };
  }

  async sendDailyUpdateReminder(sprintId: string): Promise<
    ApiResponse<{
      sentCount: number;
      totalPending: number;
      message: string;
      errors?: string[];
    }>
  > {
    await delay(300);

    const team = getCurrentTeam();
    const allUpdates = [...mockDailyUpdates, ...this.dynamicDailyUpdates];
    const today = new Date().toISOString().split('T')[0];
    const todayUpdates = allUpdates.filter(
      (u) => u.sprintId === sprintId && u.updateDate === today
    );

    const submittedUserIds = new Set(todayUpdates.map((u) => u.userId));
    const pendingMembers = (team.members ?? []).filter((m) => !submittedUserIds.has(m.userId));

    return {
      success: true,
      data: {
        sentCount: pendingMembers.length,
        totalPending: pendingMembers.length,
        message:
          pendingMembers.length > 0
            ? `Reminder sent to ${pendingMembers.length} team member(s)`
            : 'All team members have already submitted their updates',
      },
    };
  }

  // ==================== Impediments ====================
  async getImpediments(teamId: string): Promise<ApiResponse<Impediment[]>> {
    await delay(300);
    const impediments = mockImpediments.filter((i) => i.teamId === teamId);
    return { success: true, data: impediments };
  }

  async createImpediment(impediment: Partial<Impediment>): Promise<ApiResponse<Impediment>> {
    await delay(400);

    const currentUser = getCurrentUser();
    const newImpediment: Impediment = {
      id: `imp-${Date.now()}`,
      teamId: impediment.teamId ?? getCurrentTeam().id,
      sprintId: impediment.sprintId,
      title: impediment.title ?? 'New Impediment',
      description: impediment.description ?? '',
      reportedById: currentUser.id,
      ownerId: impediment.ownerId,
      status: ImpedimentStatus.OPEN,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reportedBy: currentUser,
    };

    return { success: true, data: newImpediment };
  }

  async updateImpediment(
    id: string,
    updates: Partial<Impediment>
  ): Promise<ApiResponse<Impediment>> {
    await delay(300);

    const impedimentIndex = mockImpediments.findIndex((i) => i.id === id);
    if (impedimentIndex === -1) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Impediment not found',
        },
      };
    }

    const updatedImpediment = {
      ...(mockImpediments[impedimentIndex] as Impediment),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === ImpedimentStatus.RESOLVED) {
      updatedImpediment.resolvedAt = new Date().toISOString();
    }

    return { success: true, data: updatedImpediment };
  }

  // ==================== Reports ====================
  async getVelocityData(
    _teamId: string
  ): Promise<ApiResponse<{ sprints: string[]; planned: number[]; completed: number[] }>> {
    await delay(300);

    const sprints = mockVelocityData.map((v) => v.sprintName);
    const planned = mockVelocityData.map((v) => v.planned);
    const completed = mockVelocityData.map((v) => v.completed);

    return {
      success: true,
      data: { sprints, planned, completed },
    };
  }

  async getSprintHistory(_teamId: string): Promise<ApiResponse<SprintHistoryItem[]>> {
    await delay(300);

    const history: SprintHistoryItem[] = mockSprints.map((sprint) => ({
      id: sprint.id,
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status,
      plannedPoints: 13 + Math.floor(Math.random() * 10),
      completedPoints:
        sprint.status === SprintStatus.COMPLETED
          ? 13 + Math.floor(Math.random() * 8)
          : Math.floor(Math.random() * 10),
      teamMembers: 5,
      impediments: Math.floor(Math.random() * 3),
    }));

    return { success: true, data: history };
  }

  async getTeamMetrics(_teamId: string): Promise<ApiResponse<TeamMetrics>> {
    await delay(300);

    const metrics: TeamMetrics = {
      averageVelocity: 15.5,
      velocityTrend: 12,
      successRate: 85,
      successRateTrend: 5,
      impediments: {
        resolved: 2,
        total: 3,
      },
      teamSatisfaction: {
        rating: 4.2,
        trend: 0.3,
      },
    };

    return { success: true, data: metrics };
  }

  async getInsights(_teamId: string): Promise<ApiResponse<Insight[]>> {
    await delay(300);

    const insights: Insight[] = [
      {
        id: 'insight-1',
        type: 'positive',
        icon: 'positive',
        title: 'Consistent Delivery',
        description: 'Team has maintained 100% sprint goal completion in the last 2 sprints',
      },
      {
        id: 'insight-2',
        type: 'warning',
        icon: 'warning',
        title: 'Impediment Trend',
        description:
          '2 impediments reported in current sprint. Consider addressing CSS conflicts proactively.',
      },
      {
        id: 'insight-3',
        type: 'positive',
        icon: 'positive',
        title: 'Velocity Improvement',
        description: 'Average velocity increased by 12% compared to previous month',
      },
    ];

    return { success: true, data: insights };
  }

  // ==================== Product Goals ====================
  async getProductGoals(teamId: string): Promise<ApiResponse<ProductGoal[]>> {
    await delay(300);
    const goals = mockProductGoals.filter((g) => g.teamId === teamId);
    return { success: true, data: goals };
  }

  async getActiveProductGoal(teamId: string): Promise<ApiResponse<ProductGoal>> {
    await delay(300);
    const activeGoal = mockProductGoals.find((g) => g.teamId === teamId && g.status === 'ACTIVE');

    if (!activeGoal) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active product goal found',
        },
      };
    }

    return { success: true, data: activeGoal };
  }

  async createProductGoal(goal: Partial<ProductGoal>): Promise<ApiResponse<ProductGoal>> {
    await delay(500);

    const newGoal: ProductGoal = {
      id: `goal-${Date.now()}`,
      teamId: goal.teamId ?? getCurrentTeam().id,
      title: goal.title ?? 'New Goal',
      description: goal.description,
      status: (goal.status ?? 'active').toUpperCase() as ProductGoal['status'],
      targetDate: goal.targetDate,
      successMetrics: goal.successMetrics,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: newGoal };
  }

  async updateProductGoal(
    id: string,
    updates: Partial<ProductGoal>
  ): Promise<ApiResponse<ProductGoal>> {
    await delay(400);

    const goalIndex = mockProductGoals.findIndex((g) => g.id === id);
    if (goalIndex === -1) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product goal not found',
        },
      };
    }

    const updatedGoal = {
      ...(mockProductGoals[goalIndex] as ProductGoal),
      ...updates,
      status: updates.status
        ? (updates.status.toUpperCase() as ProductGoal['status'])
        : (mockProductGoals[goalIndex] as ProductGoal).status,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: updatedGoal };
  }

  async deleteProductGoal(_id: string): Promise<ApiResponse<never>> {
    await delay(300);
    return { success: true };
  }

  async getProductGoalStatusHistory(_id: string): Promise<ApiResponse<StatusChangeHistoryItem[]>> {
    await delay(300);
    // Return empty array for mock - real implementation will fetch from database
    return { success: true, data: [] };
  }

  // ==================== Sprint Configuration ====================

  // Store generated sprints in memory for demo
  private generatedSprintsStore: GeneratedSprint[] = [];
  private sprintConfigStore: SprintConfiguration | null = null;

  async getSprintConfiguration(teamId: string): Promise<ApiResponse<SprintConfiguration>> {
    await delay(300);

    if (this.sprintConfigStore?.teamId === teamId) {
      return { success: true, data: this.sprintConfigStore };
    }

    // Return and store default configuration
    const defaultConfig: SprintConfiguration = {
      id: `config-${teamId}`,
      teamId,
      duration: '2weeks' as SprintDuration,
      year: new Date().getFullYear(),
      sprintStartDay: 1,
      generatedAt: new Date().toISOString(),
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
    };

    this.sprintConfigStore = defaultConfig;
    return { success: true, data: defaultConfig };
  }

  async createSprintConfiguration(
    config: Partial<SprintConfiguration>
  ): Promise<ApiResponse<SprintConfiguration>> {
    await delay(400);

    const newConfig: SprintConfiguration = {
      id: `config-${Date.now()}`,
      teamId: config.teamId ?? 'team-1',
      duration: config.duration ?? ('2weeks' as SprintDuration),
      year: config.year ?? new Date().getFullYear(),
      sprintStartDay: config.sprintStartDay ?? 1,
      generatedAt: new Date().toISOString(),
      updatedBy: 'current-user',
      updatedAt: new Date().toISOString(),
    };

    this.sprintConfigStore = newConfig;
    return { success: true, data: newConfig };
  }

  async updateSprintConfiguration(
    id: string,
    updates: Partial<SprintConfiguration>
  ): Promise<ApiResponse<SprintConfiguration>> {
    await delay(400);

    if (this.sprintConfigStore?.id === id) {
      this.sprintConfigStore = {
        ...this.sprintConfigStore,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return { success: true, data: this.sprintConfigStore };
    }

    // If config doesn't exist, create a new one
    const newConfig: SprintConfiguration = {
      id,
      teamId: updates.teamId ?? 'team-1',
      duration: updates.duration ?? ('2weeks' as SprintDuration),
      year: updates.year ?? new Date().getFullYear(),
      sprintStartDay: updates.sprintStartDay ?? 1,
      generatedAt: new Date().toISOString(),
      updatedBy: 'current-user',
      updatedAt: new Date().toISOString(),
    };

    this.sprintConfigStore = newConfig;
    return { success: true, data: newConfig };
  }

  async generateSprintsForYear(
    teamId: string,
    duration: SprintDuration,
    year: number
  ): Promise<ApiResponse<SprintGenerationResult>> {
    await delay(800);

    const sprints: GeneratedSprint[] = [];
    const shortYear = year.toString().slice(-2);
    const weekDuration = duration === '2weeks' ? 14 : 28; // days

    // Find first Monday of the year
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
      endDate.setDate(endDate.getDate() + weekDuration - 1);

      if (endDate.getFullYear() > year) break;

      const formattedSprintNum = sprintNumber.toString().padStart(2, '0');
      const formatDateSimple = (d: Date) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
      const dateRange = `${formatDateSimple(startDate)}-${formatDateSimple(endDate)}`;
      const name = `Sprint-${shortYear}${formattedSprintNum} (${dateRange})`;

      sprints.push({
        id: `sprint-${year}-${sprintNumber}`,
        teamId,
        name,
        sprintNumber,
        year,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: SprintStatus.PLANNED,
        createdAt: new Date().toISOString(),
      });

      currentDate.setDate(currentDate.getDate() + weekDuration);
      sprintNumber++;
    }

    // Store generated sprints
    this.generatedSprintsStore = [
      ...this.generatedSprintsStore.filter((s) => s.year !== year || s.teamId !== teamId),
      ...sprints,
    ];

    return {
      success: true,
      data: {
        success: true,
        generatedCount: sprints.length,
        sprints,
        message: `Successfully generated ${sprints.length} sprints for ${year}`,
      },
    };
  }

  async getGeneratedSprints(
    teamId: string,
    year?: number
  ): Promise<ApiResponse<GeneratedSprint[]>> {
    await delay(300);

    let filtered = this.generatedSprintsStore.filter((s) => s.teamId === teamId);

    if (year) {
      filtered = filtered.filter((s) => s.year === year);
    }

    // If no sprints exist, generate some for demo
    if (filtered.length === 0 && year === new Date().getFullYear()) {
      const result = await this.generateSprintsForYear(teamId, '2weeks' as SprintDuration, year);
      if (result.success && result.data) {
        filtered = result.data.sprints;
      }
    }

    return { success: true, data: filtered };
  }

  async deleteGeneratedSprint(sprintId: string): Promise<ApiResponse<never>> {
    await delay(300);

    this.generatedSprintsStore = this.generatedSprintsStore.filter((s) => s.id !== sprintId);
    return { success: true };
  }

  async updateGeneratedSprint(
    sprintId: string,
    updates: { sprintGoal?: string }
  ): Promise<ApiResponse<GeneratedSprint>> {
    await delay(400);

    const sprintIndex = this.generatedSprintsStore.findIndex((s) => s.id === sprintId);

    if (sprintIndex === -1) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Generated sprint not found',
        },
      };
    }

    this.generatedSprintsStore[sprintIndex] = {
      ...(this.generatedSprintsStore[sprintIndex] as GeneratedSprint),
      ...updates,
    };

    return { success: true, data: this.generatedSprintsStore[sprintIndex] as GeneratedSprint };
  }

  // ==================== System Parameters ====================

  private systemParametersStore: SystemParameter[] = [
    {
      id: 'param-1',
      key: 'sprint_duration',
      value: '2weeks',
      description: 'Default sprint duration',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
    },
  ];

  async getSystemParameters(): Promise<ApiResponse<SystemParameter[]>> {
    await delay(300);
    return { success: true, data: this.systemParametersStore };
  }

  async updateSystemParameter(key: string, value: string): Promise<ApiResponse<SystemParameter>> {
    await delay(400);

    const paramIndex = this.systemParametersStore.findIndex((p) => p.key === key);
    if (paramIndex === -1) {
      const newParam: SystemParameter = {
        id: `param-${Date.now()}`,
        key,
        value,
        updatedBy: 'current-user',
        updatedAt: new Date().toISOString(),
      };
      this.systemParametersStore.push(newParam);
      return { success: true, data: newParam };
    }

    this.systemParametersStore[paramIndex] = {
      ...(this.systemParametersStore[paramIndex] as SystemParameter),
      value,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: this.systemParametersStore[paramIndex] as SystemParameter };
  }

  // ==================== Definition of Done ====================

  async getDefinitionOfDone(teamId: string): Promise<ApiResponse<DefinitionOfDone>> {
    await delay(300);
    const team = mockTeams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } };
    }

    const dod = mockDefinitionOfDone[teamId];
    if (!dod) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Definition of Done not found for this team' },
      };
    }

    return { success: true, data: dod };
  }

  async updateDefinitionOfDone(
    teamId: string,
    items: DoDItem[]
  ): Promise<ApiResponse<DefinitionOfDone>> {
    await delay(400);
    const team = mockTeams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } };
    }

    const existingDoD = mockDefinitionOfDone[teamId];
    const updatedDoD: DefinitionOfDone = {
      ...existingDoD,
      id: existingDoD?.id ?? `dod-${teamId}`,
      teamId,
      items,
      version: (existingDoD?.version ?? 0) + 1,
      updatedBy: getCurrentUser().id,
      updatedAt: new Date().toISOString(),
    };

    // Update the mock data store
    mockDefinitionOfDone[teamId] = updatedDoD;

    return { success: true, data: updatedDoD };
  }

  async getDoDHistory(_teamId: string): Promise<ApiResponse<DefinitionOfDone[]>> {
    await delay(300);
    return { success: true, data: [] };
  }

  async verifyDoDForPBI(
    pbiId: string,
    verifications: { dodItemId: string; isVerified: boolean; notes?: string }[]
  ): Promise<ApiResponse<DoDChecklistVerification[]>> {
    await delay(400);
    const results: DoDChecklistVerification[] = verifications.map((v) => ({
      id: `verification-${Date.now()}-${v.dodItemId}`,
      pbiId,
      dodItemId: v.dodItemId,
      isVerified: v.isVerified,
      verifiedBy: 'current-user',
      verifiedAt: new Date().toISOString(),
      notes: v.notes,
    }));
    return { success: true, data: results };
  }

  async getDoDComplianceReport(sprintId: string): Promise<ApiResponse<DoDComplianceReport>> {
    await delay(300);
    return {
      success: true,
      data: {
        sprintId,
        totalPBIs: 5,
        dodCompliantPBIs: 3,
        pendingVerification: 2,
        failedCompliance: 0,
        complianceRate: 60,
        pbiDetails: [],
      },
    };
  }

  // ==================== Definition of Ready ====================

  private mockDefinitionOfReady: Record<string, DefinitionOfReady> = {
    'team-1': {
      id: 'dor-team-1',
      teamId: 'team-1',
      items: [
        {
          id: 'dor-1',
          description: 'Clear title and description',
          category: 'Documentation',
          isActive: true,
          order: 1,
        },
        {
          id: 'dor-2',
          description: 'Acceptance criteria defined',
          category: 'Documentation',
          isActive: true,
          order: 2,
        },
        {
          id: 'dor-3',
          description: 'Story points estimated',
          category: 'Estimation',
          isActive: true,
          order: 3,
        },
        {
          id: 'dor-4',
          description: 'Business value assigned',
          category: 'Estimation',
          isActive: true,
          order: 4,
        },
        {
          id: 'dor-5',
          description: 'Dependencies identified',
          category: 'Dependencies',
          isActive: true,
          order: 5,
        },
        {
          id: 'dor-6',
          description: 'No blockers',
          category: 'Dependencies',
          isActive: true,
          order: 6,
        },
      ],
      version: 1,
      updatedAt: new Date().toISOString(),
    },
  };

  async getDefinitionOfReady(teamId: string): Promise<ApiResponse<DefinitionOfReady>> {
    await delay(300);
    const team = mockTeams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } };
    }

    const dor = this.mockDefinitionOfReady[teamId];
    if (!dor) {
      return {
        success: true,
        data: {
          id: `dor-${teamId}`,
          teamId,
          items: [],
          version: 1,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    return { success: true, data: dor };
  }

  async updateDefinitionOfReady(
    teamId: string,
    items: DoRItem[]
  ): Promise<ApiResponse<DefinitionOfReady>> {
    await delay(400);
    const team = mockTeams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } };
    }

    const existingDoR = this.mockDefinitionOfReady[teamId];
    const updatedDoR: DefinitionOfReady = {
      ...existingDoR,
      id: existingDoR?.id ?? `dor-${teamId}`,
      teamId,
      items,
      version: (existingDoR?.version ?? 0) + 1,
      updatedBy: getCurrentUser().id,
      updatedAt: new Date().toISOString(),
    };

    this.mockDefinitionOfReady[teamId] = updatedDoR;

    return { success: true, data: updatedDoR };
  }

  async getDoRHistory(_teamId: string): Promise<ApiResponse<DefinitionOfReady[]>> {
    await delay(300);
    return { success: true, data: [] };
  }

  async verifyDoRForPBI(
    pbiId: string,
    verifications: { dorItemId: string; isVerified: boolean; notes?: string }[]
  ): Promise<ApiResponse<DoRChecklistVerification[]>> {
    await delay(400);
    const results: DoRChecklistVerification[] = verifications.map((v) => ({
      id: `verification-${Date.now()}-${v.dorItemId}`,
      pbiId,
      dorItemId: v.dorItemId,
      isVerified: v.isVerified,
      verifiedBy: 'current-user',
      verifiedAt: new Date().toISOString(),
      notes: v.notes,
    }));
    return { success: true, data: results };
  }

  // ==================== Increments ====================

  private incrementsStore: Increment[] = [
    {
      id: 'increment-1',
      sprintId: 'sprint-5',
      teamId: 'team-1',
      name: 'Sprint 5 - Increment 1',
      description: 'Authentication and user management features',
      includedPBIs: ['pbi-1', 'pbi-2'],
      dodVerifications: [],
      totalStoryPoints: 13,
      status: IncrementStatus.DELIVERED,
      createdAt: '2026-02-10T10:00:00Z',
      deliveredAt: '2026-02-13T15:00:00Z',
      deliveryMethod: DeliveryMethod.SPRINT_REVIEW,
      createdBy: 'user-2',
    },
  ];

  async getIncrements(teamId: string, sprintId?: string): Promise<ApiResponse<Increment[]>> {
    await delay(300);
    let filtered = this.incrementsStore.filter((i) => i.teamId === teamId);
    if (sprintId) {
      filtered = filtered.filter((i) => i.sprintId === sprintId);
    }
    return { success: true, data: filtered };
  }

  async getIncrement(id: string): Promise<ApiResponse<Increment>> {
    await delay(300);
    const increment = this.incrementsStore.find((i) => i.id === id);
    if (!increment) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Increment not found' } };
    }
    return { success: true, data: increment };
  }

  async createIncrement(increment: Partial<Increment>): Promise<ApiResponse<Increment>> {
    await delay(400);
    const newIncrement: Increment = {
      id: `increment-${Date.now()}`,
      sprintId: increment.sprintId ?? '',
      teamId: increment.teamId ?? 'team-1',
      name: increment.name ?? 'New Increment',
      description: increment.description,
      includedPBIs: increment.includedPBIs ?? [],
      dodVerifications: increment.dodVerifications ?? [],
      totalStoryPoints: increment.totalStoryPoints ?? 0,
      status: IncrementStatus.DRAFT,
      createdAt: new Date().toISOString(),
      createdBy: increment.createdBy ?? 'current-user',
    };
    this.incrementsStore.push(newIncrement);
    return { success: true, data: newIncrement };
  }

  async updateIncrement(id: string, updates: Partial<Increment>): Promise<ApiResponse<Increment>> {
    await delay(400);
    const index = this.incrementsStore.findIndex((i) => i.id === id);
    if (index === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Increment not found' } };
    }
    this.incrementsStore[index] = { ...(this.incrementsStore[index] as Increment), ...updates };
    return { success: true, data: this.incrementsStore[index] as Increment };
  }

  async deliverIncrement(
    id: string,
    deliveryMethod: 'sprint_review' | 'early_release',
    notes?: string
  ): Promise<ApiResponse<Increment>> {
    await delay(400);
    const index = this.incrementsStore.findIndex((i) => i.id === id);
    if (index === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Increment not found' } };
    }
    this.incrementsStore[index] = {
      ...(this.incrementsStore[index] as Increment),
      status: IncrementStatus.DELIVERED,
      deliveredAt: new Date().toISOString(),
      deliveryMethod: deliveryMethod as DeliveryMethod,
      notes,
    };
    return { success: true, data: this.incrementsStore[index] as Increment };
  }

  async getIncrementMetrics(_teamId: string): Promise<ApiResponse<IncrementMetrics>> {
    await delay(300);
    return {
      success: true,
      data: {
        totalIncrements: 10,
        deliveredIncrements: 8,
        averageDeliveryTime: 12,
        averageStoryPoints: 21,
        earlyReleases: 2,
        sprintReviewDeliveries: 8,
      },
    };
  }

  async getEligiblePBIsForIncrement(_sprintId: string): Promise<ApiResponse<ProductBacklogItem[]>> {
    await delay(300);
    const eligible = mockProductBacklogItems.filter((p) => p.status === ItemStatus.DONE);
    return { success: true, data: eligible };
  }

  // ==================== Sprint Reviews ====================

  private sprintReviewsStore: SprintReview[] = [
    {
      id: 'review-1',
      sprintId: 'sprint-5',
      teamId: 'team-1',
      incrementId: 'increment-1',
      reviewDate: '2026-02-13T15:00:00Z',
      attendees: [
        { id: 'attendee-1', name: 'Product Owner', role: 'product_owner', attended: true },
        { id: 'attendee-2', name: 'Scrum Master', role: 'scrum_master', attended: true },
        { id: 'attendee-3', name: 'Developer 1', role: 'developer', attended: true },
      ],
      feedback: [],
      backlogAdjustments: [],
      summary: 'Sprint 5 review completed successfully',
      createdAt: '2026-02-13T15:00:00Z',
      updatedAt: '2026-02-13T16:00:00Z',
    },
  ];

  async getSprintReviews(teamId: string, sprintId?: string): Promise<ApiResponse<SprintReview[]>> {
    await delay(300);
    let reviews = this.sprintReviewsStore.filter((r) => r.teamId === teamId);
    if (sprintId) {
      reviews = reviews.filter((r) => r.sprintId === sprintId);
    }
    return { success: true, data: reviews };
  }

  async getSprintReview(id: string): Promise<ApiResponse<SprintReview>> {
    await delay(300);
    const review = this.sprintReviewsStore.find((r) => r.id === id);
    if (!review) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } };
    }
    return { success: true, data: review };
  }

  async createSprintReview(review: Partial<SprintReview>): Promise<ApiResponse<SprintReview>> {
    await delay(400);
    const newReview: SprintReview = {
      id: `review-${Date.now()}`,
      sprintId: review.sprintId ?? '',
      teamId: review.teamId ?? 'team-1',
      incrementId: review.incrementId ?? '',
      reviewDate: review.reviewDate ?? new Date().toISOString(),
      attendees: review.attendees ?? [],
      feedback: review.feedback ?? [],
      backlogAdjustments: review.backlogAdjustments ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.sprintReviewsStore.push(newReview);
    return { success: true, data: newReview };
  }

  async updateSprintReview(
    id: string,
    updates: Partial<SprintReview>
  ): Promise<ApiResponse<SprintReview>> {
    await delay(400);
    const index = this.sprintReviewsStore.findIndex((r) => r.id === id);
    if (index === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } };
    }
    this.sprintReviewsStore[index] = {
      ...(this.sprintReviewsStore[index] as SprintReview),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: this.sprintReviewsStore[index] as SprintReview };
  }

  async addAttendee(
    _reviewId: string,
    attendee: Partial<ReviewAttendee>
  ): Promise<ApiResponse<ReviewAttendee>> {
    await delay(300);
    const newAttendee: ReviewAttendee = {
      id: `attendee-${Date.now()}`,
      name: attendee.name ?? 'New Attendee',
      email: attendee.email,
      role: attendee.role ?? 'stakeholder',
      attended: attendee.attended ?? false,
    };
    return { success: true, data: newAttendee };
  }

  async updateAttendee(
    _attendeeId: string,
    updates: Partial<ReviewAttendee>
  ): Promise<ApiResponse<ReviewAttendee>> {
    await delay(300);
    return {
      success: true,
      data: {
        id: _attendeeId,
        name: 'Updated',
        role: 'stakeholder',
        attended: updates.attended ?? false,
      },
    };
  }

  async deleteAttendee(_attendeeId: string): Promise<ApiResponse<never>> {
    await delay(300);
    return { success: true };
  }

  async addStakeholderFeedback(
    reviewId: string,
    feedback: Partial<StakeholderFeedback>
  ): Promise<ApiResponse<StakeholderFeedback>> {
    await delay(400);
    const newFeedback: StakeholderFeedback = {
      id: `feedback-${Date.now()}`,
      reviewId,
      authorName: feedback.authorName ?? 'Anonymous',
      content: feedback.content ?? '',
      category: feedback.category ?? 'positive',
      actionRequired: feedback.actionRequired ?? false,
      actionTaken: false,
      createdAt: new Date().toISOString(),
    };
    return { success: true, data: newFeedback };
  }

  // ==================== Sprint Retrospectives ====================

  private retrospectivesStore: SprintRetrospective[] = [
    {
      id: 'retro-1',
      sprintId: 'sprint-5',
      teamId: 'team-1',
      retroDate: '2026-02-14T18:00:00Z',
      facilitatorId: 'user-2',
      status: RetrospectiveStatus.DRAFT,
      participants: [
        { id: 'user-1', firstName: 'John', lastName: 'Admin', role: 'developer' },
        { id: 'user-2', firstName: 'Sarah', lastName: 'Smith', role: 'scrum_master' },
        { id: 'user-3', firstName: 'Mike', lastName: 'Wilson', role: 'product_owner' },
        { id: 'user-4', firstName: 'Emma', lastName: 'Davis', role: 'developer' },
        { id: 'user-5', firstName: 'Alex', lastName: 'Brown', role: 'developer' },
      ],
      attendees: [],
      items: [
        {
          id: 'item-1',
          retrospectiveId: 'retro-1',
          category: RetrospectiveCategory.WENT_WELL,
          content: 'Good collaboration on authentication feature',
          authorName: 'Developer 1',
          votes: 3,
          votedBy: [
            '018ff5b8-0e1a-7e8c-9d2f-4a6b8c3d5e7f',
            '018ff5b8-0e1b-7e8c-9d2f-4a6b8c3d5e80',
            '018ff5b8-0e1c-7e8c-9d2f-4a6b8c3d5e81',
          ],
          order: 0,
          createdAt: '2026-02-14T18:05:00Z',
        },
        {
          id: 'item-2',
          retrospectiveId: 'retro-1',
          category: RetrospectiveCategory.DIDNT_GO_WELL,
          content: 'Sprint Planning took too long',
          authorName: 'Scrum Master',
          votes: 4,
          votedBy: [
            '018ff5b8-0e1a-7e8c-9d2f-4a6b8c3d5e7f',
            '018ff5b8-0e1b-7e8c-9d2f-4a6b8c3d5e80',
            '018ff5b8-0e1c-7e8c-9d2f-4a6b8c3d5e81',
            '018ff5b8-0e1d-7e8c-9d2f-4a6b8c3d5e82',
          ],
          order: 0,
          createdAt: '2026-02-14T18:10:00Z',
        },
        {
          id: 'item-3',
          retrospectiveId: 'retro-1',
          category: RetrospectiveCategory.IMPROVEMENT,
          content: 'Introduce time-boxing for ceremonies',
          authorName: 'Product Owner',
          votes: 5,
          votedBy: [
            '018ff5b8-0e1a-7e8c-9d2f-4a6b8c3d5e7f',
            '018ff5b8-0e1b-7e8c-9d2f-4a6b8c3d5e80',
            '018ff5b8-0e1c-7e8c-9d2f-4a6b8c3d5e81',
            '018ff5b8-0e1d-7e8c-9d2f-4a6b8c3d5e82',
            '018ff5b8-0e1e-7e8c-9d2f-4a6b8c3d5e83',
          ],
          order: 0,
          createdAt: '2026-02-14T18:15:00Z',
        },
      ],
      actionItems: [
        {
          id: 'action-1',
          retrospectiveId: 'retro-1',
          title: 'Create time-boxing guidelines',
          description: 'Define time limits for each ceremony',
          ownerId: 'user-2',
          status: 'IN_PROGRESS',
          addedToSprintBacklog: false,
          createdAt: '2026-02-14T18:45:00Z',
        },
      ],
      isAnonymous: false,
      createdAt: '2026-02-14T18:00:00Z',
      updatedAt: '2026-02-14T18:45:00Z',
    },
  ];

  async getRetrospectives(teamId: string): Promise<ApiResponse<SprintRetrospective[]>> {
    await delay(300);
    return { success: true, data: this.retrospectivesStore.filter((r) => r.teamId === teamId) };
  }

  async getRetrospective(id: string): Promise<ApiResponse<SprintRetrospective>> {
    await delay(300);
    const retro = this.retrospectivesStore.find((r) => r.id === id);
    if (!retro) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Retrospective not found' } };
    }
    return { success: true, data: retro };
  }

  async createRetrospective(
    retro: Partial<SprintRetrospective>
  ): Promise<ApiResponse<SprintRetrospective>> {
    await delay(400);
    const newRetro: SprintRetrospective = {
      id: `retro-${Date.now()}`,
      sprintId: retro.sprintId ?? '',
      teamId: retro.teamId ?? 'team-1',
      retroDate: retro.retroDate ?? new Date().toISOString(),
      facilitatorId: retro.facilitatorId ?? 'current-user',
      status: RetrospectiveStatus.DRAFT,
      participants: retro.participants ?? [],
      attendees: retro.attendees ?? [],
      items: retro.items ?? [],
      actionItems: retro.actionItems ?? [],
      isAnonymous: retro.isAnonymous ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.retrospectivesStore.push(newRetro);
    return { success: true, data: newRetro };
  }

  async updateRetrospective(
    id: string,
    updates: Partial<SprintRetrospective>
  ): Promise<ApiResponse<SprintRetrospective>> {
    await delay(400);
    const index = this.retrospectivesStore.findIndex((r) => r.id === id);
    if (index === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Retrospective not found' } };
    }
    this.retrospectivesStore[index] = {
      ...(this.retrospectivesStore[index] as SprintRetrospective),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: this.retrospectivesStore[index] as SprintRetrospective };
  }

  async addRetrospectiveItem(
    retroId: string,
    item: Partial<RetrospectiveItem>
  ): Promise<ApiResponse<RetrospectiveItem>> {
    await delay(400);
    const newItem: RetrospectiveItem = {
      id: `item-${Date.now()}`,
      retrospectiveId: retroId,
      category: item.category ?? RetrospectiveCategory.IMPROVEMENT,
      content: item.content ?? '',
      authorName: item.authorName,
      votes: 0,
      votedBy: [],
      order: 0,
      createdAt: new Date().toISOString(),
    };
    const retroIndex = this.retrospectivesStore.findIndex((r) => r.id === retroId);
    if (retroIndex !== -1) {
      (this.retrospectivesStore[retroIndex] as SprintRetrospective).items.push(newItem);
    }
    return { success: true, data: newItem };
  }

  async voteRetrospectiveItem(
    retroId: string,
    itemId: string
  ): Promise<ApiResponse<RetrospectiveItem>> {
    await delay(300);
    const retroIndex = this.retrospectivesStore.findIndex((r) => r.id === retroId);
    if (retroIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Retrospective not found' } };
    }
    const itemIndex = (this.retrospectivesStore[retroIndex] as SprintRetrospective).items.findIndex(
      (i) => i.id === itemId
    );
    if (itemIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } };
    }
    const currentUser = getCurrentUser();
    const existingItems = (this.retrospectivesStore[retroIndex] as SprintRetrospective).items;
    const item = existingItems[itemIndex];
    if (!item) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } };
    }

    // Add user to votedBy if not already voted
    item.votedBy ??= [];
    if (!item.votedBy.includes(currentUser.id)) {
      item.votedBy.push(currentUser.id);
      item.votes += 1;
    }

    return { success: true, data: item };
  }

  async unvoteRetrospectiveItem(
    retroId: string,
    itemId: string
  ): Promise<ApiResponse<RetrospectiveItem>> {
    await delay(300);
    const retroIndex = this.retrospectivesStore.findIndex((r) => r.id === retroId);
    if (retroIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Retrospective not found' } };
    }
    const itemIndex = (this.retrospectivesStore[retroIndex] as SprintRetrospective).items.findIndex(
      (i) => i.id === itemId
    );
    if (itemIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } };
    }
    const currentUser = getCurrentUser();
    const existingItems = (this.retrospectivesStore[retroIndex] as SprintRetrospective).items;
    const item = existingItems[itemIndex];
    if (!item) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } };
    }

    // Remove user from votedBy if they have voted
    item.votedBy ??= [];
    const voteIndex = item.votedBy.indexOf(currentUser.id);
    if (voteIndex !== -1) {
      item.votedBy.splice(voteIndex, 1);
      if (item.votes > 0) {
        item.votes -= 1;
      }
    }

    return { success: true, data: item };
  }

  async updateRetrospectiveItem(
    retroId: string,
    itemId: string,
    updates: Partial<RetrospectiveItem>
  ): Promise<ApiResponse<RetrospectiveItem>> {
    await delay(400);
    const retroIndex = this.retrospectivesStore.findIndex((r) => r.id === retroId);
    if (retroIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Retrospective not found' } };
    }
    const itemIndex = (this.retrospectivesStore[retroIndex] as SprintRetrospective).items.findIndex(
      (i) => i.id === itemId
    );
    if (itemIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } };
    }
    const existingItems = (this.retrospectivesStore[retroIndex] as SprintRetrospective).items;
    const existingItem = existingItems[itemIndex];
    if (!existingItem) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } };
    }
    existingItems[itemIndex] = {
      ...existingItem,
      ...updates,
    };
    return { success: true, data: existingItems[itemIndex] };
  }

  async deleteRetrospectiveItem(retroId: string, itemId: string): Promise<ApiResponse<void>> {
    await delay(400);
    const retroIndex = this.retrospectivesStore.findIndex((r) => r.id === retroId);
    if (retroIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Retrospective not found' } };
    }
    const itemIndex = (this.retrospectivesStore[retroIndex] as SprintRetrospective).items.findIndex(
      (i) => i.id === itemId
    );
    if (itemIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } };
    }
    (this.retrospectivesStore[retroIndex] as SprintRetrospective).items.splice(itemIndex, 1);
    return { success: true, data: undefined };
  }

  async addActionItem(
    retroId: string,
    actionItem: Partial<RetroActionItem>
  ): Promise<ApiResponse<RetroActionItem>> {
    await delay(400);
    const newActionItem: RetroActionItem = {
      id: `action-${Date.now()}`,
      retrospectiveId: retroId,
      title: actionItem.title ?? '',
      description: actionItem.description,
      ownerId: actionItem.ownerId ?? 'current-user',
      dueDate: actionItem.dueDate,
      status: 'PENDING',
      addedToSprintBacklog: false,
      createdAt: new Date().toISOString(),
    };
    const retroIndex = this.retrospectivesStore.findIndex((r) => r.id === retroId);
    if (retroIndex !== -1) {
      (this.retrospectivesStore[retroIndex] as SprintRetrospective).actionItems.push(newActionItem);
    }
    return { success: true, data: newActionItem };
  }

  async updateActionItem(
    retroId: string,
    actionItemId: string,
    updates: Partial<RetroActionItem>
  ): Promise<ApiResponse<RetroActionItem>> {
    await delay(400);
    const retroIndex = this.retrospectivesStore.findIndex((r) => r.id === retroId);
    if (retroIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Retrospective not found' } };
    }
    const actionIndex = (
      this.retrospectivesStore[retroIndex] as SprintRetrospective
    ).actionItems.findIndex((a) => a.id === actionItemId);
    if (actionIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Action item not found' } };
    }
    const existingActionItems = (this.retrospectivesStore[retroIndex] as SprintRetrospective)
      .actionItems;
    const existingActionItem = existingActionItems[actionIndex];
    if (!existingActionItem) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Action item not found' } };
    }
    existingActionItems[actionIndex] = {
      ...existingActionItem,
      ...updates,
    };
    return { success: true, data: existingActionItems[actionIndex] };
  }

  async deleteActionItem(retroId: string, actionItemId: string): Promise<ApiResponse<void>> {
    await delay(400);
    const retroIndex = this.retrospectivesStore.findIndex((r) => r.id === retroId);
    if (retroIndex === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Retrospective not found' } };
    }
    const retro = this.retrospectivesStore[retroIndex] as SprintRetrospective;
    retro.actionItems = retro.actionItems.filter((a) => a.id !== actionItemId);
    return { success: true, data: undefined };
  }

  // ==================== Team Context ====================

  setCurrentTeamContext(_teamId: string): void {
    // No-op for mock
  }

  clearTeamContext(): void {
    // No-op for mock
  }

  async getMyTeams(): Promise<ApiResponse<(Team & { userRole: string })[]>> {
    await delay(300);
    const teamsWithRoles = mockTeams.map((team) => ({
      ...team,
      userRole: 'developer' as string,
    }));
    return {
      success: true,
      data: teamsWithRoles,
    };
  }

  async getMyRoleInTeam(_teamId: string): Promise<ApiResponse<{ role: string }>> {
    await delay(200);
    return {
      success: true,
      data: { role: 'developer' },
    };
  }

  async selectTeam(teamId: string): Promise<ApiResponse<Team & { userRole: string }>> {
    await delay(300);
    const team = mockTeams.find((t) => t.id === teamId);
    if (!team) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Team not found',
        },
      };
    }
    return {
      success: true,
      data: {
        ...team,
        userRole: 'developer',
      },
    };
  }

  // ==================== DoD Verifications ====================

  async getDoDVerificationsForPBI(
    _pbiId: string
  ): Promise<ApiResponse<DoDChecklistVerification[]>> {
    await delay(300);
    return { success: true, data: [] };
  }

  // ==================== Retrospective Attendees ====================

  async getRetrospectiveBySprintId(sprintId: string): Promise<ApiResponse<SprintRetrospective>> {
    await delay(300);
    const retro = this.retrospectivesStore.find((r) => r.sprintId === sprintId);
    if (!retro) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Retrospective not found for this sprint' },
      };
    }
    return { success: true, data: retro };
  }

  async addRetroAttendee(
    _retroId: string,
    attendeeData: { name: string; email?: string; role: string; attended: boolean }
  ): Promise<ApiResponse<RetroAttendee>> {
    await delay(300);
    const newAttendee: RetroAttendee = {
      id: `retro-attendee-${Date.now()}`,
      name: attendeeData.name,
      email: attendeeData.email,
      role: attendeeData.role,
      attended: attendeeData.attended,
    };
    return { success: true, data: newAttendee };
  }

  async updateRetroAttendee(
    _attendeeId: string,
    attendeeData: { name?: string; email?: string; role?: string; attended?: boolean }
  ): Promise<ApiResponse<RetroAttendee>> {
    await delay(300);
    return {
      success: true,
      data: {
        id: _attendeeId,
        name: attendeeData.name ?? 'Updated',
        role: attendeeData.role ?? 'stakeholder',
        attended: attendeeData.attended ?? false,
      },
    };
  }

  async deleteRetroAttendee(_attendeeId: string): Promise<ApiResponse<{ message: string }>> {
    await delay(300);
    return { success: true, data: { message: 'Attendee deleted' } };
  }

  // ==================== Sprint Backlog Management ====================

  async getAvailablePBIsForSprint(teamId: string): Promise<ApiResponse<ProductBacklogItem[]>> {
    await delay(300);
    const available = mockProductBacklogItems.filter(
      (p) =>
        p.teamId === teamId &&
        (p.status === ItemStatus.NEW ||
          p.status === ItemStatus.REFINED ||
          p.status === ItemStatus.READY)
    );
    return { success: true, data: available };
  }

  async getSprintBacklogChanges(
    _sprintId: string,
    _limit?: number
  ): Promise<ApiResponse<BacklogChange[]>> {
    await delay(300);
    return { success: true, data: [] };
  }

  async addPBIToSprint(
    _sprintId: string,
    _pbiId: string,
    _reason?: string
  ): Promise<ApiResponse<{ sprintBacklogItem: SprintBacklogItem; change: BacklogChange }>> {
    await delay(400);
    return {
      success: true,
      data: {
        sprintBacklogItem: {
          id: `sbi-${Date.now()}`,
          sprintId: _sprintId,
          pbiId: _pbiId,
          addedAt: new Date().toISOString(),
        },
        change: {
          id: `change-${Date.now()}`,
          sprintId: _sprintId,
          pbiId: _pbiId,
          changeType: 'ADDED' as const,
          reason: _reason,
          changedBy: 'mock-user',
          changedAt: new Date().toISOString(),
        },
      },
    };
  }

  async removePBIFromSprint(
    _sprintId: string,
    _pbiId: string,
    _taskAction?: 'delete' | 'return_to_backlog' | 'keep_in_sprint',
    _reason?: string
  ): Promise<ApiResponse<{ change: BacklogChange }>> {
    await delay(400);
    return {
      success: true,
      data: {
        change: {
          id: `change-${Date.now()}`,
          sprintId: _sprintId,
          pbiId: _pbiId,
          changeType: 'REMOVED' as const,
          reason: _reason,
          changedBy: 'mock-user',
          changedAt: new Date().toISOString(),
          taskAction: _taskAction,
        },
      },
    };
  }

  async getPendingRetroActionItems(teamId: string): Promise<ApiResponse<RetroActionItem[]>> {
    await delay(300);
    const pendingItems: RetroActionItem[] = [];
    this.retrospectivesStore
      .filter((r) => r.teamId === teamId)
      .forEach((retro) => {
        retro.actionItems
          .filter((a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS')
          .forEach((item) => pendingItems.push(item));
      });
    return { success: true, data: pendingItems };
  }

  async getPendingAdjustments(_teamId: string): Promise<ApiResponse<BacklogAdjustment[]>> {
    await delay(300);
    return { success: true, data: [] };
  }

  async markAdjustmentImplemented(_adjustmentId: string): Promise<ApiResponse<BacklogAdjustment>> {
    await delay(300);
    return {
      success: true,
      data: {
        id: _adjustmentId,
        reviewId: '',
        action: 'modify',
        description: 'Implemented',
        reason: '',
        implemented: true,
        createdAt: new Date().toISOString(),
      },
    };
  }

  async getPendingFeedback(_teamId: string): Promise<ApiResponse<StakeholderFeedback[]>> {
    await delay(300);
    return { success: true, data: [] };
  }

  async markFeedbackAddressed(_feedbackId: string): Promise<ApiResponse<StakeholderFeedback>> {
    await delay(300);
    return {
      success: true,
      data: {
        id: _feedbackId,
        reviewId: '',
        authorName: 'Anonymous',
        content: '',
        category: 'positive',
        actionRequired: false,
        actionTaken: true,
        createdAt: new Date().toISOString(),
      },
    };
  }

  async deleteImpediment(_id: string, _teamId: string): Promise<ApiResponse<never>> {
    await delay(300);
    return { success: true };
  }

  async promoteToImpediment(
    _dailyUpdateId: string,
    impedimentData: {
      title: string;
      description?: string;
      ownerId?: string;
      priority?: string;
      teamId: string;
      sprintId?: string;
    }
  ): Promise<ApiResponse<{ dailyUpdate: DailyUpdate; impediment: Impediment }>> {
    await delay(400);
    const currentUser = getCurrentUser();
    const newImpediment: Impediment = {
      id: `imp-${Date.now()}`,
      teamId: impedimentData.teamId,
      sprintId: impedimentData.sprintId,
      title: impedimentData.title,
      description: impedimentData.description ?? '',
      reportedById: currentUser.id,
      ownerId: impedimentData.ownerId,
      status: ImpedimentStatus.OPEN,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reportedBy: currentUser,
    };
    const dailyUpdate: DailyUpdate = {
      id: _dailyUpdateId,
      sprintId: impedimentData.sprintId ?? '',
      userId: currentUser.id,
      updateDate: new Date().toISOString().split('T')[0] ?? '',
      createdAt: new Date().toISOString(),
      user: currentUser,
    };
    return { success: true, data: { dailyUpdate, impediment: newImpediment } };
  }

  async getTasksByPbiId(pbiId: string): Promise<ApiResponse<Task[]>> {
    await delay(300);
    const tasks = mockTasks.filter((t) => t.pbiId === pbiId);
    return { success: true, data: tasks };
  }

  async getDoRVerificationsForPBI(
    _pbiId: string
  ): Promise<ApiResponse<DoRChecklistVerification[]>> {
    await delay(300);
    return { success: true, data: [] };
  }

  async updateTeam(_id: string, _teamData: Partial<Team>): Promise<ApiResponse<Team>> {
    await delay(400);
    const team = mockTeams.find((t) => t.id === _id);
    if (!team) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } };
    }
    return { success: true, data: { ...team, ..._teamData, updatedAt: new Date().toISOString() } };
  }

  async deleteTeam(_id: string): Promise<ApiResponse<null>> {
    await delay(300);
    return { success: true };
  }

  // ==================== Notification Config ====================

  async getNotificationConfig(): Promise<
    ApiResponse<{
      emailEnabled: boolean;
      pushEnabled: boolean;
      slackEnabled: boolean;
      digestFrequency: string;
    }>
  > {
    await mockDelay(200);
    return mockSuccess({
      emailEnabled: true,
      pushEnabled: false,
      slackEnabled: true,
      digestFrequency: 'daily',
    });
  }

  // ==================== Notifications ====================

  private notificationsStore: AppNotification[] = [
    {
      id: 'notif-1',
      userId: 'user-1',
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: 'You have been assigned to "Implement login feature"',
      data: { taskId: 'task-1', pbiId: 'pbi-1' },
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      type: 'mention',
      title: 'You were mentioned',
      message: 'John mentioned you in a comment',
      data: { commentId: 'comment-1' },
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'notif-3',
      userId: 'user-1',
      type: 'sprint_update',
      title: 'Sprint Started',
      message: 'Sprint-2603 has started',
      data: { sprintId: 'sprint-1' },
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  async getNotifications(): Promise<ApiResponse<AppNotification[]>> {
    await mockDelay(300);
    return mockSuccess([...this.notificationsStore]);
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    await mockDelay(100);
    const count = this.notificationsStore.filter((n) => !n.isRead).length;
    return mockSuccess({ count });
  }

  async markAsRead(id: string): Promise<ApiResponse<AppNotification>> {
    await mockDelay(200);
    const notif = this.notificationsStore.find((n) => n.id === id);
    if (!notif) {
      return mockError('NOT_FOUND', 'Notification not found');
    }
    notif.isRead = true;
    return mockSuccess({ ...notif });
  }

  async markAllAsRead(): Promise<ApiResponse<{ count: number }>> {
    await mockDelay(200);
    let count = 0;
    this.notificationsStore.forEach((n) => {
      if (!n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    return mockSuccess({ count });
  }

  async deleteNotification(id: string): Promise<ApiResponse<never>> {
    await mockDelay(200);
    const index = this.notificationsStore.findIndex((n) => n.id === id);
    if (index === -1) {
      return mockError('NOT_FOUND', 'Notification not found');
    }
    this.notificationsStore.splice(index, 1);
    return mockSuccess(undefined as never);
  }

  async sendDirectMessage(data: {
    recipientId: string;
    message: string;
  }): Promise<ApiResponse<{ success: boolean }>> {
    await mockDelay(300);
    const newNotification: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: data.recipientId,
      type: 'direct_message',
      title: 'New Message',
      message: data.message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notificationsStore.push(newNotification);
    return mockSuccess({ success: true });
  }

  // ==================== Workflow ====================

  private workflowStatesStore: Record<string, WorkflowState[]> = {
    ProductBacklogItem: [
      {
        id: 'state-1',
        workflowId: 'workflow-pbi',
        name: 'NEW',
        displayName: 'New',
        orderIndex: 0,
        isFinal: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'state-2',
        workflowId: 'workflow-pbi',
        name: 'REFINED',
        displayName: 'Refined',
        orderIndex: 1,
        isFinal: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'state-3',
        workflowId: 'workflow-pbi',
        name: 'READY',
        displayName: 'Ready',
        orderIndex: 2,
        isFinal: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'state-4',
        workflowId: 'workflow-pbi',
        name: 'IN_PROGRESS',
        displayName: 'In Progress',
        orderIndex: 3,
        isFinal: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'state-5',
        workflowId: 'workflow-pbi',
        name: 'DONE',
        displayName: 'Done',
        orderIndex: 4,
        isFinal: true,
        createdAt: new Date().toISOString(),
      },
    ],
    Task: [
      {
        id: 'state-10',
        workflowId: 'workflow-task',
        name: 'TODO',
        displayName: 'To Do',
        orderIndex: 0,
        isFinal: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'state-11',
        workflowId: 'workflow-task',
        name: 'IN_PROGRESS',
        displayName: 'In Progress',
        orderIndex: 1,
        isFinal: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'state-12',
        workflowId: 'workflow-task',
        name: 'DONE',
        displayName: 'Done',
        orderIndex: 2,
        isFinal: true,
        createdAt: new Date().toISOString(),
      },
    ],
    Impediment: [
      {
        id: 'state-20',
        workflowId: 'workflow-impediment',
        name: 'OPEN',
        displayName: 'Open',
        orderIndex: 0,
        isFinal: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'state-21',
        workflowId: 'workflow-impediment',
        name: 'IN_PROGRESS',
        displayName: 'In Progress',
        orderIndex: 1,
        isFinal: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'state-22',
        workflowId: 'workflow-impediment',
        name: 'RESOLVED',
        displayName: 'Resolved',
        orderIndex: 2,
        isFinal: true,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  private workflowTransitionsStore: Record<string, WorkflowTransition[]> = {
    ProductBacklogItem: [
      { id: 'trans-1', entityType: 'ProductBacklogItem', fromState: 'NEW', toState: 'REFINED' },
      { id: 'trans-2', entityType: 'ProductBacklogItem', fromState: 'REFINED', toState: 'READY' },
      {
        id: 'trans-3',
        entityType: 'ProductBacklogItem',
        fromState: 'READY',
        toState: 'IN_PROGRESS',
      },
      {
        id: 'trans-4',
        entityType: 'ProductBacklogItem',
        fromState: 'IN_PROGRESS',
        toState: 'DONE',
      },
    ],
    Task: [
      { id: 'trans-10', entityType: 'Task', fromState: 'TODO', toState: 'IN_PROGRESS' },
      { id: 'trans-11', entityType: 'Task', fromState: 'IN_PROGRESS', toState: 'DONE' },
    ],
    Impediment: [
      { id: 'trans-20', entityType: 'Impediment', fromState: 'OPEN', toState: 'IN_PROGRESS' },
      { id: 'trans-21', entityType: 'Impediment', fromState: 'IN_PROGRESS', toState: 'RESOLVED' },
    ],
  };

  private statusChangeHistoryStore: Array<{
    id: string;
    entityType: string;
    entityId: string;
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    changedAt: string;
  }> = [
    {
      id: 'history-1',
      entityType: 'ProductBacklogItem',
      entityId: 'pbi-001',
      fromStatus: 'NEW',
      toStatus: 'REFINED',
      changedBy: 'user-1',
      changedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  async getWorkflowStates(entityType: string): Promise<ApiResponse<WorkflowState[]>> {
    await mockDelay(200);
    const states = this.workflowStatesStore[entityType] ?? [];
    return mockSuccess(states);
  }

  async getAllowedTransitions(
    entityType: string,
    fromStatus: string
  ): Promise<ApiResponse<string[]>> {
    await mockDelay(200);
    const transitions = this.workflowTransitionsStore[entityType] ?? [];
    const allowed = transitions.filter((t) => t.fromState === fromStatus).map((t) => t.toState);
    return mockSuccess(allowed);
  }

  async getWorkflowTransitions(entityType: string): Promise<ApiResponse<WorkflowTransition[]>> {
    await mockDelay(200);
    const transitions = this.workflowTransitionsStore[entityType] ?? [];
    return mockSuccess(transitions);
  }

  async getWorkflowByEntityType(
    entityType: string
  ): Promise<ApiResponse<{ states: WorkflowState[]; transitions: WorkflowTransition[] }>> {
    await mockDelay(200);
    return mockSuccess({
      states: this.workflowStatesStore[entityType] ?? [],
      transitions: this.workflowTransitionsStore[entityType] ?? [],
    });
  }

  async validateTransition(
    entityType: string,
    _entityId: string,
    fromStatus: string,
    toStatus: string
  ): Promise<ApiResponse<{ valid: boolean; message?: string }>> {
    await mockDelay(200);
    const transitions = this.workflowTransitionsStore[entityType] ?? [];
    const isValid = transitions.some((t) => t.fromState === fromStatus && t.toState === toStatus);
    if (isValid) {
      return mockSuccess({ valid: true });
    }
    return mockSuccess({
      valid: false,
      message: `Transition from ${fromStatus} to ${toStatus} is not allowed for ${entityType}`,
    });
  }

  async getWorkflowStatusChangeHistory(
    entityType: string,
    entityId: string
  ): Promise<
    ApiResponse<
      Array<{
        id: string;
        entityType: string;
        entityId: string;
        fromStatus: string;
        toStatus: string;
        changedBy: string;
        changedAt: string;
      }>
    >
  > {
    await mockDelay(200);
    const history = this.statusChangeHistoryStore.filter(
      (h) => h.entityType === entityType && h.entityId === entityId
    );
    return mockSuccess(history);
  }

  // ==================== Data Export ====================

  private exportStore: Map<
    string,
    {
      status: 'pending' | 'processing' | 'completed' | 'failed';
      progress: number;
      downloadUrl?: string;
      createdAt: string;
      error?: string;
    }
  > = new Map();

  async initiateExport(): Promise<ApiResponse<{ exportId: string; estimatedTime: number }>> {
    await mockDelay(500);
    const exportId = `export-${Date.now()}`;
    this.exportStore.set(exportId, {
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
    });

    // Simulate async processing - complete after 5 seconds
    setTimeout(() => {
      const exp = this.exportStore.get(exportId);
      if (exp?.status === 'processing') {
        exp.status = 'completed';
        exp.progress = 100;
        exp.downloadUrl = `/mock-exports/${exportId}.zip`;
      }
    }, 5000);

    return mockSuccess({ exportId, estimatedTime: 30 });
  }

  async getExportStatus(exportId: string): Promise<
    ApiResponse<{
      status: string;
      progress: number;
      downloadUrl?: string;
      error?: string;
    }>
  > {
    await mockDelay(200);
    const exp = this.exportStore.get(exportId);
    if (!exp) {
      return mockError('NOT_FOUND', 'Export not found');
    }
    return mockSuccess({
      status: exp.status,
      progress: exp.progress,
      downloadUrl: exp.downloadUrl,
      error: exp.error,
    });
  }

  async downloadExport(exportId: string): Promise<ApiResponse<{ url: string }>> {
    await mockDelay(300);
    const exp = this.exportStore.get(exportId);
    if (!exp) {
      return mockError('NOT_FOUND', 'Export not found');
    }
    if (exp.status !== 'completed') {
      return mockError('INVALID_STATE', 'Export is not ready for download');
    }
    return mockSuccess({ url: exp.downloadUrl ?? `/mock-exports/${exportId}.zip` });
  }

  async cancelExport(exportId: string): Promise<ApiResponse<{ message: string }>> {
    await mockDelay(200);
    const exp = this.exportStore.get(exportId);
    if (!exp) {
      return mockError('NOT_FOUND', 'Export not found');
    }
    if (exp.status === 'completed') {
      return mockError('INVALID_STATE', 'Cannot cancel a completed export');
    }
    this.exportStore.delete(exportId);
    return mockSuccess({ message: 'Export cancelled successfully' });
  }

  async getActiveExports(): Promise<ApiResponse<string[]>> {
    await mockDelay(200);
    const active = Array.from(this.exportStore.entries())
      .filter(([_, v]) => v.status === 'processing')
      .map(([k]) => k);
    return mockSuccess(active);
  }

  // ==================== Consent Management ====================

  async recordConsent(data: {
    consentType: string;
    granted: boolean;
  }): Promise<ApiResponse<ConsentRecord>> {
    await mockDelay(300);
    const record: ConsentRecord = {
      id: `consent-${Date.now()}`,
      userId: 'user-1', // Mock current user
      consentType: data.consentType as ConsentRecord['consentType'],
      granted: data.granted,
      grantedAt: data.granted ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };
    this.consentStore.push(record);
    return mockSuccess(record);
  }

  async getConsentHistory(): Promise<ApiResponse<ConsentRecord[]>> {
    await mockDelay(300);
    return mockSuccess([...this.consentStore]);
  }

  async getLatestConsent(): Promise<ApiResponse<ConsentRecord | null>> {
    await mockDelay(200);
    const latest =
      this.consentStore.length > 0 ? this.consentStore[this.consentStore.length - 1] : null;
    return mockSuccess(latest ?? null);
  }

  async withdrawConsent(): Promise<ApiResponse<{ message: string }>> {
    await mockDelay(300);
    this.consentStore.forEach((c) => {
      if (c.granted) {
        c.granted = false;
        c.withdrawnAt = new Date().toISOString();
      }
    });
    return mockSuccess({ message: 'Consent withdrawn successfully' });
  }

  async getAnonymousConsent(consentId: string): Promise<ApiResponse<ConsentRecord | null>> {
    await mockDelay(200);
    const consent = this.consentStore.find((c) => c.id === consentId) ?? null;
    return mockSuccess(consent);
  }
}

export const mockApiService = new MockApiService();
