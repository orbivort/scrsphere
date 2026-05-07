import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SprintBoardPage extends BasePage {
  readonly pageHeader: Locator;
  readonly sprintOverview: Locator;
  readonly newTaskButton: Locator;
  readonly completeSprintButton: Locator;
  readonly toggleBurndownButton: Locator;
  readonly keyboardHelpButton: Locator;
  readonly backlogManagerButton: Locator;
  readonly kanbanBoard: Locator;
  readonly todoColumn: Locator;
  readonly inProgressColumn: Locator;
  readonly doneColumn: Locator;
  readonly filterBar: Locator;
  readonly assigneeFilter: Locator;
  readonly pbiFilter: Locator;
  readonly searchInput: Locator;
  readonly viewModeToggle: Locator;
  readonly taskDetailModal: Locator;
  readonly taskEditModal: Locator;
  readonly taskCreateModal: Locator;
  readonly deleteModal: Locator;
  readonly completeSprintModal: Locator;
  readonly dodVerificationModal: Locator;
  readonly burndownChart: Locator;
  readonly wipWarning: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('[data-testid="sprint-board"], [class*="sprint-board"]').first();
    this.sprintOverview = page.locator('[class*="sprint-overview"]').first();
    this.newTaskButton = page
      .locator('button:has-text("New Task"), button:has-text("Add Task")')
      .first();
    this.completeSprintButton = page.locator(
      'button:has-text("Complete Sprint"), button:has-text("End Sprint")'
    );
    this.toggleBurndownButton = page.locator(
      'button:has-text("Burndown"), [aria-label*="burndown" i]'
    );
    this.keyboardHelpButton = page.locator(
      'button:has-text("Keyboard"), [aria-label*="keyboard" i]'
    );
    this.backlogManagerButton = page.locator(
      'button:has-text("Backlog"), [aria-label*="backlog" i]'
    );
    this.kanbanBoard = page.locator('#kanban-board, [class*="kanban-board"]');
    this.todoColumn = page
      .locator('[class*="column"]:has(h3:has-text("TO DO")), [data-status="todo"]')
      .first();
    this.inProgressColumn = page
      .locator('[class*="column"]:has(h3:has-text("IN PROGRESS")), [data-status="in_progress"]')
      .first();
    this.doneColumn = page
      .locator('[class*="column"]:has(h3:has-text("DONE")), [data-status="done"]')
      .first();
    this.filterBar = page.locator('[class*="board-filters"], [class*="filter-bar"]');
    this.assigneeFilter = page.locator('[name="assignee"], [aria-label*="assignee" i]');
    this.pbiFilter = page.locator('[name="pbi"], [aria-label*="pbi" i], [aria-label*="backlog" i]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.viewModeToggle = page.locator('[class*="view-mode"], button[aria-label*="view" i]');
    this.taskDetailModal = page.locator(
      '[class*="task-detail-modal"], [class*="modal"]:has(h2:has-text("Task"))'
    );
    this.taskEditModal = page.locator('[class*="task-edit-modal"]');
    this.taskCreateModal = page.locator('[class*="task-create-modal"]');
    this.deleteModal = page.locator(
      '[class*="delete-modal"], [class*="modal"]:has(h2:has-text("Delete"))'
    );
    this.completeSprintModal = page.locator('[class*="complete-sprint-modal"]');
    this.dodVerificationModal = page.locator(
      '[class*="dod-verification"], [class*="modal"]:has(h2:has-text("Definition of Done"))'
    );
    this.burndownChart = page.locator('[class*="burndown-chart"], [class*="chart"]').first();
    this.wipWarning = page.locator('[class*="wip-warning"], [class*="warning"]');
    this.emptyState = page.locator('[class*="empty-state"]').first();
  }

  async goto(): Promise<void> {
    await this.navigate('/sprint');
    await this.waitForPageLoad();
  }

  async clickNewTask(): Promise<void> {
    await this.newTaskButton.click();
  }

  async clickCompleteSprint(): Promise<void> {
    await this.completeSprintButton.click();
  }

  async toggleBurndown(): Promise<void> {
    await this.toggleBurndownButton.click();
  }

  async isBurndownVisible(): Promise<boolean> {
    return this.isElementVisible(this.burndownChart);
  }

  async getTodoTasks(): Promise<Locator[]> {
    return this.todoColumn.locator('[class*="task-card"], [class*="task-item"]').all();
  }

  async getInProgressTasks(): Promise<Locator[]> {
    return this.inProgressColumn.locator('[class*="task-card"], [class*="task-item"]').all();
  }

  async getDoneTasks(): Promise<Locator[]> {
    return this.doneColumn.locator('[class*="task-card"], [class*="task-item"]').all();
  }

  async getTaskByTitle(title: string): Promise<Locator> {
    return this.page
      .locator(
        `[class*="task-card"]:has-text("${title}"), [class*="task-item"]:has-text("${title}")`
      )
      .first();
  }

  async clickTask(title: string): Promise<void> {
    const task = await this.getTaskByTitle(title);
    await task.click();
  }

  async dragTask(fromTitle: string, toStatus: 'todo' | 'in_progress' | 'done'): Promise<void> {
    const task = await this.getTaskByTitle(fromTitle);
    const targetColumn =
      toStatus === 'todo'
        ? this.todoColumn
        : toStatus === 'in_progress'
          ? this.inProgressColumn
          : this.doneColumn;

    await task.dragTo(targetColumn);
  }

  async fillTaskForm(data: {
    title: string;
    description?: string;
    assigneeId?: string;
    pbiId?: string;
    estimatedHours?: number;
    remainingHours?: number;
  }): Promise<void> {
    await this.page.locator('#title, [name="title"]').fill(data.title);

    if (data.description) {
      await this.page.locator('#description, [name="description"]').fill(data.description);
    }

    if (data.assigneeId) {
      await this.page.locator('[name="assigneeId"]').selectOption(data.assigneeId);
    }

    if (data.pbiId) {
      await this.page.locator('[name="pbiId"]').selectOption(data.pbiId);
    }

    if (data.estimatedHours) {
      await this.page
        .locator('#estimatedHours, [name="estimatedHours"]')
        .fill(data.estimatedHours.toString());
    }

    if (data.remainingHours) {
      await this.page
        .locator('#remainingHours, [name="remainingHours"]')
        .fill(data.remainingHours.toString());
    }
  }

  async submitTaskForm(): Promise<void> {
    await this.page
      .locator('button[type="submit"]:has-text("Create"), button:has-text("Add")')
      .click();
  }

  async hasSprintOverview(): Promise<boolean> {
    return this.isElementVisible(this.sprintOverview);
  }

  async hasKanbanBoard(): Promise<boolean> {
    return this.isElementVisible(this.kanbanBoard);
  }

  async hasWipWarning(): Promise<boolean> {
    return this.isElementVisible(this.wipWarning);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }

  async filterByAssignee(assigneeId: string): Promise<void> {
    await this.assigneeFilter.selectOption(assigneeId);
  }

  async searchTasks(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async getSprintStats(): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  }> {
    const todo = (await this.getTodoTasks()).length;
    const inProgress = (await this.getInProgressTasks()).length;
    const done = (await this.getDoneTasks()).length;

    return {
      total: todo + inProgress + done,
      todo,
      inProgress,
      done,
    };
  }
}
