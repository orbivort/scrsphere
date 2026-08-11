-- AlterTable: Add smNotes to sprints table
ALTER TABLE "sprints" ADD COLUMN "smNotes" TEXT;

-- AlterTable: Add integrationVerified to increments table
ALTER TABLE "increments" ADD COLUMN "integrationVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add smNotes to sprint_reviews table
ALTER TABLE "sprint_reviews" ADD COLUMN "smNotes" TEXT;

-- AlterTable: Add smNotes to sprint_retrospectives table
ALTER TABLE "sprint_retrospectives" ADD COLUMN "smNotes" TEXT;

-- AlterTable: Add productGoalAssessment to stakeholder_feedback table
ALTER TABLE "stakeholder_feedback" ADD COLUMN "productGoalAssessment" TEXT;

-- CreateEnum: IntegrationTestResult
CREATE TYPE "IntegrationTestResult" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum: ScrumValue
CREATE TYPE "ScrumValue" AS ENUM ('COMMITMENT', 'FOCUS', 'OPENNESS', 'RESPECT', 'COURAGE');

-- CreateEnum: HealthCheckStatus
CREATE TYPE "HealthCheckStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable: IncrementIntegrationTest
CREATE TABLE "increment_integration_tests" (
    "id" UUID NOT NULL,
    "currentIncrementId" UUID NOT NULL,
    "priorIncrementId" UUID NOT NULL,
    "testResult" "IntegrationTestResult" NOT NULL DEFAULT 'PENDING',
    "testedById" UUID NOT NULL,
    "testedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "increment_integration_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductGoalSnapshot
CREATE TABLE "product_goal_snapshots" (
    "id" UUID NOT NULL,
    "goalId" UUID NOT NULL,
    "sprintReviewId" UUID NOT NULL,
    "successMetricValues" JSONB,
    "completedPbiCount" INTEGER NOT NULL DEFAULT 0,
    "completedStoryPoints" INTEGER NOT NULL DEFAULT 0,
    "assessment" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "product_goal_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TeamHealthCheck
CREATE TABLE "team_health_checks" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "sprintId" UUID,
    "status" "HealthCheckStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "team_health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TeamHealthCheckResponse
CREATE TABLE "team_health_check_responses" (
    "id" UUID NOT NULL,
    "healthCheckId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scrumValue" "ScrumValue" NOT NULL,
    "score" INTEGER NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "team_health_check_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: increments team/status/createdAt for SM dashboard queries
CREATE INDEX "increments_teamId_status_createdAt_idx" ON "increments"("teamId", "status", "createdAt");

-- CreateIndex: impediments team/status/createdAt for SM dashboard queries
CREATE INDEX "impediments_teamId_status_createdAt_idx" ON "impediments"("teamId", "status", "createdAt");

-- CreateIndex: retro_action_items owner/status/dueDate for SM dashboard queries
CREATE INDEX "retro_action_items_ownerId_status_dueDate_idx" ON "retro_action_items"("ownerId", "status", "dueDate");

-- CreateIndex: increment_integration_tests
CREATE UNIQUE INDEX "increment_integration_tests_currentIncrementId_priorIncrementId_key" ON "increment_integration_tests"("currentIncrementId", "priorIncrementId");
CREATE INDEX "increment_integration_tests_currentIncrementId_idx" ON "increment_integration_tests"("currentIncrementId");
CREATE INDEX "increment_integration_tests_priorIncrementId_idx" ON "increment_integration_tests"("priorIncrementId");
CREATE INDEX "increment_integration_tests_testedById_idx" ON "increment_integration_tests"("testedById");

-- CreateIndex: product_goal_snapshots
CREATE UNIQUE INDEX "product_goal_snapshots_goalId_sprintReviewId_key" ON "product_goal_snapshots"("goalId", "sprintReviewId");
CREATE INDEX "product_goal_snapshots_goalId_idx" ON "product_goal_snapshots"("goalId");
CREATE INDEX "product_goal_snapshots_sprintReviewId_idx" ON "product_goal_snapshots"("sprintReviewId");

-- CreateIndex: team_health_checks
CREATE INDEX "team_health_checks_teamId_idx" ON "team_health_checks"("teamId");
CREATE INDEX "team_health_checks_sprintId_idx" ON "team_health_checks"("sprintId");
CREATE INDEX "team_health_checks_status_idx" ON "team_health_checks"("status");
CREATE INDEX "team_health_checks_teamId_status_createdAt_idx" ON "team_health_checks"("teamId", "status", "createdAt");

-- CreateIndex: team_health_check_responses
CREATE UNIQUE INDEX "team_health_check_responses_healthCheckId_userId_scrumValue_key" ON "team_health_check_responses"("healthCheckId", "userId", "scrumValue");
CREATE INDEX "team_health_check_responses_healthCheckId_idx" ON "team_health_check_responses"("healthCheckId");
CREATE INDEX "team_health_check_responses_userId_idx" ON "team_health_check_responses"("userId");
CREATE INDEX "team_health_check_responses_healthCheckId_scrumValue_idx" ON "team_health_check_responses"("healthCheckId", "scrumValue");

-- AddForeignKey: increment_integration_tests currentIncrementId -> increments
ALTER TABLE "increment_integration_tests" ADD CONSTRAINT "increment_integration_tests_currentIncrementId_fkey" FOREIGN KEY ("currentIncrementId") REFERENCES "increments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: increment_integration_tests priorIncrementId -> increments
ALTER TABLE "increment_integration_tests" ADD CONSTRAINT "increment_integration_tests_priorIncrementId_fkey" FOREIGN KEY ("priorIncrementId") REFERENCES "increments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: increment_integration_tests testedById -> users
ALTER TABLE "increment_integration_tests" ADD CONSTRAINT "increment_integration_tests_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: product_goal_snapshots goalId -> product_goals
ALTER TABLE "product_goal_snapshots" ADD CONSTRAINT "product_goal_snapshots_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "product_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: product_goal_snapshots sprintReviewId -> sprint_reviews
ALTER TABLE "product_goal_snapshots" ADD CONSTRAINT "product_goal_snapshots_sprintReviewId_fkey" FOREIGN KEY ("sprintReviewId") REFERENCES "sprint_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: team_health_checks teamId -> teams
ALTER TABLE "team_health_checks" ADD CONSTRAINT "team_health_checks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: team_health_checks sprintId -> sprints
ALTER TABLE "team_health_checks" ADD CONSTRAINT "team_health_checks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: team_health_check_responses healthCheckId -> team_health_checks
ALTER TABLE "team_health_check_responses" ADD CONSTRAINT "team_health_check_responses_healthCheckId_fkey" FOREIGN KEY ("healthCheckId") REFERENCES "team_health_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: team_health_check_responses userId -> users
ALTER TABLE "team_health_check_responses" ADD CONSTRAINT "team_health_check_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
