-- ============================================
-- INIT MIGRATION
-- Consolidated initial schema for Scrumooth.
-- ============================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE "UserRole" AS ENUM ('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPERS');
CREATE TYPE "ItemStatus" AS ENUM ('NEW', 'REFINED', 'READY', 'IN_PROGRESS', 'DONE');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
CREATE TYPE "SprintStatus" AS ENUM ('DRAFT', 'PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ImpedimentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "ProductGoalStatus" AS ENUM ('NEW', 'ACTIVE', 'COMPLETED', 'ABANDONED');
CREATE TYPE "MoSCoWPriority" AS ENUM ('MUST_HAVE', 'SHOULD_HAVE', 'COULD_HAVE', 'WONT_HAVE');
CREATE TYPE "RetrospectiveCategory" AS ENUM ('WENT_WELL', 'DIDNT_GO_WELL', 'IMPROVEMENT');
CREATE TYPE "IncrementStatus" AS ENUM ('DRAFT', 'VERIFIED', 'DELIVERED', 'ARCHIVED');
CREATE TYPE "DeliveryMethod" AS ENUM ('SPRINT_REVIEW', 'EARLY_RELEASE');
CREATE TYPE "IntegrationTestResult" AS ENUM ('PENDING', 'PASSED', 'FAILED');
CREATE TYPE "ScrumValue" AS ENUM ('COMMITMENT', 'FOCUS', 'OPENNESS', 'RESPECT', 'COURAGE');
CREATE TYPE "HealthCheckStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "FeedbackCategory" AS ENUM ('POSITIVE', 'NEGATIVE', 'SUGGESTION', 'QUESTION');
CREATE TYPE "ActionItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "RetrospectiveStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "TimeboxStatus" AS ENUM ('IDLE', 'RUNNING', 'PAUSED');
CREATE TYPE "SprintDuration" AS ENUM ('ONE_WEEK', 'TWO_WEEKS', 'THREE_WEEKS', 'FOUR_WEEKS');
CREATE TYPE "ScheduledDeletionStatus" AS ENUM ('PENDING', 'CANCELLED', 'EXECUTED', 'EXPIRED');
CREATE TYPE "NotificationType" AS ENUM ('TEAM_INVITATION', 'TEAM_REMOVAL', 'TASK_ASSIGNMENT', 'IMPEDIMENT_ASSIGNMENT', 'DAILY_SCRUM_SIGNAL', 'TEAM_CREATED', 'TEAM_UPDATED', 'TEAM_DELETED', 'DIRECT_MESSAGE', 'ACCOUNT_DELETION_SCHEDULED', 'ACCOUNT_DELETION_CANCELLED');
CREATE TYPE "EmailType" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'WELCOME', 'PASSWORD_CHANGE', 'ACCOUNT_DELETION', 'TEAM_INVITATION', 'NOTIFICATION');
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'OPENED', 'CLICKED');

-- ============================================
-- TABLES
-- ============================================
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "locale" VARCHAR(10) NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "marketing_opt_in_at" TIMESTAMPTZ(3),
    "terms_accepted_at" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_members" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_goals" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProductGoalStatus" NOT NULL,
    "targetDate" TIMESTAMPTZ(3),
    "successMetrics" TEXT,
    "strategicAlignment" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "product_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_backlog_items" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "goalId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "MoSCoWPriority" NOT NULL DEFAULT 'COULD_HAVE',
    "businessValue" INTEGER,
    "storyPoints" INTEGER,
    "status" "ItemStatus" NOT NULL DEFAULT 'NEW',
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "acceptanceCriteria" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,
    "sprintId" UUID,

    CONSTRAINT "product_backlog_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sprints" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "goalId" UUID,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3) NOT NULL,
    "sprintGoal" TEXT,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNED',
    "cancellationReason" TEXT,
    "smNotes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sprint_backlog_items" (
    "id" UUID NOT NULL,
    "sprintId" UUID NOT NULL,
    "pbiId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "sprint_backlog_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sprint_backlog_changes" (
    "id" UUID NOT NULL,
    "sprintId" UUID NOT NULL,
    "pbiId" UUID NOT NULL,
    "sprintBacklogItemId" UUID,
    "changeType" TEXT NOT NULL,
    "reason" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "taskAction" TEXT,
    "taskCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sprint_backlog_changes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "sprintId" UUID NOT NULL,
    "pbiId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" UUID,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "estimatedHours" DOUBLE PRECISION,
    "remainingHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_scrums" (
    "id" UUID NOT NULL,
    "sprintId" UUID NOT NULL,
    "scrumDate" DATE NOT NULL,
    "progressNotes" TEXT,
    "adaptationsNotes" TEXT,
    "planForNextDay" TEXT,
    "focusMode" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "daily_scrums_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_scrum_backlog_items" (
    "id" UUID NOT NULL,
    "dailyScrumId" UUID NOT NULL,
    "sprintBacklogItemId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "daily_scrum_backlog_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_scrum_participants" (
    "id" UUID NOT NULL,
    "dailyScrumId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "daily_scrum_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "burndown_data" (
    "id" UUID NOT NULL,
    "sprintId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "idealRemaining" DOUBLE PRECISION NOT NULL,
    "actualRemaining" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "burndown_data_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "impediments" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "sprintId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reportedById" UUID NOT NULL,
    "ownerId" UUID,
    "status" "ImpedimentStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "impediments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "definition_of_done" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "definition_of_done_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dod_items" (
    "id" UUID NOT NULL,
    "dodId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "dod_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dod_checklist_verifications" (
    "id" UUID NOT NULL,
    "pbiId" UUID NOT NULL,
    "dodItemId" UUID NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" UUID NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "dod_checklist_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "definition_of_ready" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "definition_of_ready_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dor_items" (
    "id" UUID NOT NULL,
    "dorId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "dor_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dor_checklist_verifications" (
    "id" UUID NOT NULL,
    "pbiId" UUID NOT NULL,
    "dorItemId" UUID NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" UUID NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "dor_checklist_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "increments" (
    "id" UUID NOT NULL,
    "sprintId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalStoryPoints" INTEGER NOT NULL DEFAULT 0,
    "status" "IncrementStatus" NOT NULL DEFAULT 'DRAFT',
    "integrationVerified" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMPTZ(3),
    "deliveryMethod" "DeliveryMethod",
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "increments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "increment_pbis" (
    "id" UUID NOT NULL,
    "incrementId" UUID NOT NULL,
    "pbiId" UUID NOT NULL,
    "addedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "increment_pbis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sprint_reviews" (
    "id" UUID NOT NULL,
    "sprintId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "incrementId" UUID NOT NULL,
    "reviewDate" TIMESTAMPTZ(3) NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "smNotes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "sprint_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_attendees" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "review_attendees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stakeholder_feedback" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "FeedbackCategory" NOT NULL DEFAULT 'POSITIVE',
    "relatedPbiId" UUID,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" UUID,
    "productGoalAssessment" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "stakeholder_feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "backlog_adjustments" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "pbiId" UUID,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "implemented" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "backlog_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sprint_retrospectives" (
    "id" UUID NOT NULL,
    "sprintId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "retroDate" TIMESTAMPTZ(3) NOT NULL,
    "facilitatorId" UUID NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "RetrospectiveStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "dodEvolutionNotes" TEXT,
    "smNotes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "sprint_retrospectives_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "retro_attendees" (
    "id" UUID NOT NULL,
    "retrospectiveId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "retro_attendees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "retrospective_items" (
    "id" UUID NOT NULL,
    "retrospectiveId" UUID NOT NULL,
    "category" "RetrospectiveCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" UUID,
    "authorName" TEXT,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "retrospective_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "retro_item_votes" (
    "id" UUID NOT NULL,
    "retrospectiveItemId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "retro_item_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "retro_action_items" (
    "id" UUID NOT NULL,
    "retrospectiveId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" UUID NOT NULL,
    "dueDate" TIMESTAMPTZ(3),
    "status" "ActionItemStatus" NOT NULL DEFAULT 'PENDING',
    "addedToSprintBacklog" BOOLEAN NOT NULL DEFAULT false,
    "relatedSprintId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "retro_action_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sprint_configurations" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "duration" "SprintDuration" NOT NULL DEFAULT 'TWO_WEEKS',
    "year" INTEGER NOT NULL,
    "sprintStartDay" INTEGER NOT NULL DEFAULT 1,
    "generatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "sprint_configurations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "generated_sprints" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "sprintId" UUID,
    "name" TEXT NOT NULL,
    "sprintNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3) NOT NULL,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNED',
    "sprintGoal" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "generated_sprints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflows" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultStatus" TEXT NOT NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_states" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_states_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_transitions" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "fromStateId" UUID NOT NULL,
    "toStateId" UUID NOT NULL,
    "condition" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" TEXT[],
    "allowedUserIds" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "status_change_history" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "workflowId" UUID NOT NULL,
    "fromStateId" UUID,
    "toStateId" UUID NOT NULL,
    "changedBy" UUID NOT NULL,
    "changeReason" TEXT,
    "changeNotes" TEXT,
    "transitionId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_change_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "messageKey" TEXT,
    "params" JSONB,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_parameters" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "system_parameters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "tokenHash" TEXT,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,
    "revokedAt" TIMESTAMPTZ(3),
    "lastActivityAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scheduled_deletions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "requested_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_deletion_at" TIMESTAMPTZ(3) NOT NULL,
    "grace_period_days" INTEGER NOT NULL DEFAULT 14,
    "status" "ScheduledDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "cancelled_at" TIMESTAMPTZ(3),
    "executed_at" TIMESTAMPTZ(3),
    "blocked_team_ids" TEXT[],
    "confirmation_phrase" TEXT NOT NULL,
    "force_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "scheduled_deletions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "consent_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "email" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "provider" TEXT NOT NULL,
    "messageId" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "testMode" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMPTZ(3),
    "deliveredAt" TIMESTAMPTZ(3),
    "openedAt" TIMESTAMPTZ(3),
    "clickedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- Tables introduced by the scrum lifecycle enhancement
CREATE TABLE "increment_integration_tests" (
    "id" UUID NOT NULL,
    "currentIncrementId" UUID NOT NULL,
    "priorIncrementId" UUID NOT NULL,
    "testResult" "IntegrationTestResult" NOT NULL DEFAULT 'PENDING',
    "testedById" UUID NOT NULL,
    "testedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "increment_integration_tests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_goal_snapshots" (
    "id" UUID NOT NULL,
    "goalId" UUID NOT NULL,
    "sprintReviewId" UUID NOT NULL,
    "successMetricValues" JSONB,
    "completedPbiCount" INTEGER NOT NULL DEFAULT 0,
    "completedStoryPoints" INTEGER NOT NULL DEFAULT 0,
    "assessment" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "product_goal_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_health_checks" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "sprintId" UUID,
    "status" "HealthCheckStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "team_health_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_health_check_responses" (
    "id" UUID NOT NULL,
    "healthCheckId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scrumValue" "ScrumValue" NOT NULL,
    "score" INTEGER NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "team_health_check_responses_pkey" PRIMARY KEY ("id")
);

-- Timebox table introduced by the sprint timeboxing feature.
CREATE TABLE "timeboxes" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "sprintId" UUID,
    "date" DATE NOT NULL,
    "status" "TimeboxStatus" NOT NULL DEFAULT 'IDLE',
    "startedAt" TIMESTAMPTZ(3),
    "pausedAt" TIMESTAMPTZ(3),
    "accumulatedMs" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "concludedAt" TIMESTAMPTZ(3),
    "concludedElapsedMs" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "timeboxes_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- INDEXES
-- ============================================
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");
CREATE INDEX "teams_createdBy_idx" ON "teams"("createdBy");
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");
CREATE INDEX "product_goals_teamId_idx" ON "product_goals"("teamId");
CREATE INDEX "product_goals_status_idx" ON "product_goals"("status");
CREATE INDEX "product_goals_targetDate_idx" ON "product_goals"("targetDate");
CREATE INDEX "product_goals_teamId_status_idx" ON "product_goals"("teamId", "status");
CREATE INDEX "product_backlog_items_teamId_idx" ON "product_backlog_items"("teamId");
CREATE INDEX "product_backlog_items_status_idx" ON "product_backlog_items"("status");
CREATE INDEX "product_backlog_items_goalId_idx" ON "product_backlog_items"("goalId");
CREATE INDEX "product_backlog_items_sprintId_idx" ON "product_backlog_items"("sprintId");
CREATE INDEX "product_backlog_items_priority_idx" ON "product_backlog_items"("priority");
CREATE INDEX "product_backlog_items_teamId_status_idx" ON "product_backlog_items"("teamId", "status");
CREATE INDEX "product_backlog_items_teamId_status_priority_idx" ON "product_backlog_items"("teamId", "status", "priority");
CREATE INDEX "sprints_teamId_idx" ON "sprints"("teamId");
CREATE INDEX "sprints_status_idx" ON "sprints"("status");
CREATE INDEX "sprints_goalId_idx" ON "sprints"("goalId");
CREATE INDEX "sprints_startDate_idx" ON "sprints"("startDate");
CREATE INDEX "sprints_endDate_idx" ON "sprints"("endDate");
CREATE INDEX "sprints_teamId_status_idx" ON "sprints"("teamId", "status");
CREATE INDEX "sprints_teamId_startDate_idx" ON "sprints"("teamId", "startDate");
CREATE INDEX "sprints_teamId_status_startDate_idx" ON "sprints"("teamId", "status", "startDate");
CREATE UNIQUE INDEX "sprint_backlog_items_sprintId_pbiId_key" ON "sprint_backlog_items"("sprintId", "pbiId");
CREATE INDEX "sprint_backlog_changes_sprintId_idx" ON "sprint_backlog_changes"("sprintId");
CREATE INDEX "sprint_backlog_changes_pbiId_idx" ON "sprint_backlog_changes"("pbiId");
CREATE INDEX "sprint_backlog_changes_createdBy_idx" ON "sprint_backlog_changes"("createdBy");
CREATE INDEX "sprint_backlog_changes_createdAt_idx" ON "sprint_backlog_changes"("createdAt");
CREATE INDEX "tasks_sprintId_idx" ON "tasks"("sprintId");
CREATE INDEX "tasks_pbiId_idx" ON "tasks"("pbiId");
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_sprintId_status_idx" ON "tasks"("sprintId", "status");
CREATE INDEX "daily_scrums_sprintId_scrumDate_idx" ON "daily_scrums"("sprintId", "scrumDate");
CREATE INDEX "daily_scrums_scrumDate_idx" ON "daily_scrums"("scrumDate");
CREATE UNIQUE INDEX "daily_scrums_sprintId_scrumDate_key" ON "daily_scrums"("sprintId", "scrumDate");
CREATE INDEX "daily_scrum_backlog_items_dailyScrumId_idx" ON "daily_scrum_backlog_items"("dailyScrumId");
CREATE INDEX "daily_scrum_backlog_items_sprintBacklogItemId_idx" ON "daily_scrum_backlog_items"("sprintBacklogItemId");
CREATE UNIQUE INDEX "daily_scrum_backlog_items_dailyScrumId_sprintBacklogItemId_key" ON "daily_scrum_backlog_items"("dailyScrumId", "sprintBacklogItemId");
CREATE INDEX "daily_scrum_participants_dailyScrumId_idx" ON "daily_scrum_participants"("dailyScrumId");
CREATE INDEX "daily_scrum_participants_userId_idx" ON "daily_scrum_participants"("userId");
CREATE UNIQUE INDEX "daily_scrum_participants_dailyScrumId_userId_key" ON "daily_scrum_participants"("dailyScrumId", "userId");
CREATE UNIQUE INDEX "burndown_data_sprintId_date_key" ON "burndown_data"("sprintId", "date");
CREATE INDEX "impediments_teamId_idx" ON "impediments"("teamId");
CREATE INDEX "impediments_status_idx" ON "impediments"("status");
CREATE INDEX "impediments_sprintId_idx" ON "impediments"("sprintId");
CREATE INDEX "impediments_reportedById_idx" ON "impediments"("reportedById");
CREATE INDEX "impediments_ownerId_idx" ON "impediments"("ownerId");
CREATE INDEX "impediments_teamId_status_idx" ON "impediments"("teamId", "status");
CREATE UNIQUE INDEX "definition_of_done_teamId_key" ON "definition_of_done"("teamId");
CREATE INDEX "dod_items_dodId_idx" ON "dod_items"("dodId");
CREATE UNIQUE INDEX "dod_items_dodId_order_key" ON "dod_items"("dodId", "order");
CREATE INDEX "dod_checklist_verifications_pbiId_idx" ON "dod_checklist_verifications"("pbiId");
CREATE INDEX "dod_checklist_verifications_dodItemId_idx" ON "dod_checklist_verifications"("dodItemId");
CREATE INDEX "dod_checklist_verifications_verifiedBy_idx" ON "dod_checklist_verifications"("verifiedBy");
CREATE UNIQUE INDEX "dod_checklist_verifications_pbiId_dodItemId_key" ON "dod_checklist_verifications"("pbiId", "dodItemId");
CREATE UNIQUE INDEX "definition_of_ready_teamId_key" ON "definition_of_ready"("teamId");
CREATE INDEX "dor_items_dorId_idx" ON "dor_items"("dorId");
CREATE UNIQUE INDEX "dor_items_dorId_order_key" ON "dor_items"("dorId", "order");
CREATE INDEX "dor_checklist_verifications_pbiId_idx" ON "dor_checklist_verifications"("pbiId");
CREATE INDEX "dor_checklist_verifications_dorItemId_idx" ON "dor_checklist_verifications"("dorItemId");
CREATE INDEX "dor_checklist_verifications_verifiedBy_idx" ON "dor_checklist_verifications"("verifiedBy");
CREATE UNIQUE INDEX "dor_checklist_verifications_pbiId_dorItemId_key" ON "dor_checklist_verifications"("pbiId", "dorItemId");
CREATE INDEX "increments_sprintId_idx" ON "increments"("sprintId");
CREATE INDEX "increments_teamId_idx" ON "increments"("teamId");
CREATE INDEX "increments_status_idx" ON "increments"("status");
CREATE INDEX "increments_deliveredAt_idx" ON "increments"("deliveredAt");
CREATE INDEX "increments_sprintId_status_idx" ON "increments"("sprintId", "status");
CREATE INDEX "increment_pbis_incrementId_idx" ON "increment_pbis"("incrementId");
CREATE INDEX "increment_pbis_pbiId_idx" ON "increment_pbis"("pbiId");
CREATE UNIQUE INDEX "increment_pbis_incrementId_pbiId_key" ON "increment_pbis"("incrementId", "pbiId");
CREATE UNIQUE INDEX "sprint_reviews_sprintId_key" ON "sprint_reviews"("sprintId");
CREATE UNIQUE INDEX "sprint_reviews_incrementId_key" ON "sprint_reviews"("incrementId");
CREATE INDEX "sprint_reviews_teamId_idx" ON "sprint_reviews"("teamId");
CREATE INDEX "sprint_reviews_reviewDate_idx" ON "sprint_reviews"("reviewDate");
CREATE INDEX "review_attendees_reviewId_idx" ON "review_attendees"("reviewId");
CREATE INDEX "stakeholder_feedback_reviewId_idx" ON "stakeholder_feedback"("reviewId");
CREATE INDEX "stakeholder_feedback_ownerId_idx" ON "stakeholder_feedback"("ownerId");
CREATE INDEX "backlog_adjustments_reviewId_idx" ON "backlog_adjustments"("reviewId");
CREATE INDEX "backlog_adjustments_pbiId_idx" ON "backlog_adjustments"("pbiId");
CREATE INDEX "backlog_adjustments_ownerId_idx" ON "backlog_adjustments"("ownerId");
CREATE UNIQUE INDEX "sprint_retrospectives_sprintId_key" ON "sprint_retrospectives"("sprintId");
CREATE INDEX "sprint_retrospectives_teamId_idx" ON "sprint_retrospectives"("teamId");
CREATE INDEX "sprint_retrospectives_facilitatorId_idx" ON "sprint_retrospectives"("facilitatorId");
CREATE INDEX "sprint_retrospectives_status_idx" ON "sprint_retrospectives"("status");
CREATE INDEX "retro_attendees_retrospectiveId_idx" ON "retro_attendees"("retrospectiveId");
CREATE INDEX "retrospective_items_retrospectiveId_idx" ON "retrospective_items"("retrospectiveId");
CREATE INDEX "retrospective_items_authorId_idx" ON "retrospective_items"("authorId");
CREATE INDEX "retrospective_items_retrospectiveId_category_idx" ON "retrospective_items"("retrospectiveId", "category");
CREATE INDEX "retro_item_votes_retrospectiveItemId_idx" ON "retro_item_votes"("retrospectiveItemId");
CREATE INDEX "retro_item_votes_userId_idx" ON "retro_item_votes"("userId");
CREATE UNIQUE INDEX "retro_item_votes_retrospectiveItemId_userId_key" ON "retro_item_votes"("retrospectiveItemId", "userId");
CREATE INDEX "retro_action_items_retrospectiveId_idx" ON "retro_action_items"("retrospectiveId");
CREATE INDEX "retro_action_items_ownerId_idx" ON "retro_action_items"("ownerId");
CREATE INDEX "retro_action_items_relatedSprintId_idx" ON "retro_action_items"("relatedSprintId");
CREATE INDEX "retro_action_items_status_idx" ON "retro_action_items"("status");
CREATE INDEX "retro_action_items_dueDate_idx" ON "retro_action_items"("dueDate");
CREATE INDEX "retro_action_items_completedAt_idx" ON "retro_action_items"("completedAt");
CREATE INDEX "retro_action_items_retrospectiveId_status_idx" ON "retro_action_items"("retrospectiveId", "status");
CREATE UNIQUE INDEX "sprint_configurations_teamId_key" ON "sprint_configurations"("teamId");
CREATE UNIQUE INDEX "generated_sprints_sprintId_key" ON "generated_sprints"("sprintId");
CREATE INDEX "generated_sprints_teamId_idx" ON "generated_sprints"("teamId");
CREATE UNIQUE INDEX "generated_sprints_teamId_year_sprintNumber_key" ON "generated_sprints"("teamId", "year", "sprintNumber");
CREATE UNIQUE INDEX "workflows_entityType_key" ON "workflows"("entityType");
CREATE INDEX "workflow_states_workflowId_idx" ON "workflow_states"("workflowId");
CREATE UNIQUE INDEX "workflow_states_workflowId_name_key" ON "workflow_states"("workflowId", "name");
CREATE UNIQUE INDEX "workflow_states_workflowId_orderIndex_key" ON "workflow_states"("workflowId", "orderIndex");
CREATE INDEX "workflow_transitions_workflowId_idx" ON "workflow_transitions"("workflowId");
CREATE INDEX "workflow_transitions_fromStateId_idx" ON "workflow_transitions"("fromStateId");
CREATE INDEX "workflow_transitions_toStateId_idx" ON "workflow_transitions"("toStateId");
CREATE UNIQUE INDEX "workflow_transitions_workflowId_fromStateId_toStateId_key" ON "workflow_transitions"("workflowId", "fromStateId", "toStateId");
CREATE INDEX "status_change_history_workflowId_idx" ON "status_change_history"("workflowId");
CREATE INDEX "status_change_history_fromStateId_idx" ON "status_change_history"("fromStateId");
CREATE INDEX "status_change_history_toStateId_idx" ON "status_change_history"("toStateId");
CREATE INDEX "status_change_history_changedBy_idx" ON "status_change_history"("changedBy");
CREATE INDEX "status_change_history_transitionId_idx" ON "status_change_history"("transitionId");
CREATE INDEX "status_change_history_entityType_idx" ON "status_change_history"("entityType");
CREATE INDEX "status_change_history_entityId_idx" ON "status_change_history"("entityId");
CREATE INDEX "status_change_history_createdAt_idx" ON "status_change_history"("createdAt");
CREATE INDEX "status_change_history_entityType_entityId_idx" ON "status_change_history"("entityType", "entityId");
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE UNIQUE INDEX "system_parameters_key_key" ON "system_parameters"("key");
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE INDEX "refresh_tokens_lastActivityAt_idx" ON "refresh_tokens"("lastActivityAt");
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");
CREATE INDEX "scheduled_deletions_user_id_idx" ON "scheduled_deletions"("user_id");
CREATE INDEX "scheduled_deletions_status_idx" ON "scheduled_deletions"("status");
CREATE INDEX "consent_records_user_id_idx" ON "consent_records"("user_id");
CREATE INDEX "consent_records_consent_type_idx" ON "consent_records"("consent_type");
CREATE INDEX "email_logs_userId_idx" ON "email_logs"("userId");
CREATE INDEX "email_logs_email_idx" ON "email_logs"("email");
CREATE INDEX "email_logs_type_idx" ON "email_logs"("type");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");
CREATE INDEX "email_logs_createdAt_idx" ON "email_logs"("createdAt");
CREATE INDEX "email_logs_createdBy_idx" ON "email_logs"("createdBy");
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");
CREATE INDEX "password_reset_tokens_tokenHash_idx" ON "password_reset_tokens"("tokenHash");
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");

-- Indexes for the scrum lifecycle enhancement tables
CREATE UNIQUE INDEX "increment_integration_tests_currentIncrementId_priorIncreme_key" ON "increment_integration_tests"("currentIncrementId", "priorIncrementId");
CREATE INDEX "increment_integration_tests_currentIncrementId_idx" ON "increment_integration_tests"("currentIncrementId");
CREATE INDEX "increment_integration_tests_priorIncrementId_idx" ON "increment_integration_tests"("priorIncrementId");
CREATE INDEX "increment_integration_tests_testedById_idx" ON "increment_integration_tests"("testedById");
CREATE UNIQUE INDEX "product_goal_snapshots_goalId_sprintReviewId_key" ON "product_goal_snapshots"("goalId", "sprintReviewId");
CREATE INDEX "product_goal_snapshots_goalId_idx" ON "product_goal_snapshots"("goalId");
CREATE INDEX "product_goal_snapshots_sprintReviewId_idx" ON "product_goal_snapshots"("sprintReviewId");
CREATE INDEX "team_health_checks_teamId_idx" ON "team_health_checks"("teamId");
CREATE INDEX "team_health_checks_sprintId_idx" ON "team_health_checks"("sprintId");
CREATE INDEX "team_health_checks_status_idx" ON "team_health_checks"("status");
CREATE INDEX "team_health_checks_teamId_status_createdAt_idx" ON "team_health_checks"("teamId", "status", "createdAt");
CREATE UNIQUE INDEX "team_health_check_responses_healthCheckId_userId_scrumValue_key" ON "team_health_check_responses"("healthCheckId", "userId", "scrumValue");
CREATE INDEX "team_health_check_responses_healthCheckId_idx" ON "team_health_check_responses"("healthCheckId");
CREATE INDEX "team_health_check_responses_userId_idx" ON "team_health_check_responses"("userId");
CREATE INDEX "team_health_check_responses_healthCheckId_scrumValue_idx" ON "team_health_check_responses"("healthCheckId", "scrumValue");

-- Timebox indexes
CREATE INDEX "timeboxes_teamId_idx" ON "timeboxes"("teamId");
CREATE INDEX "timeboxes_sprintId_idx" ON "timeboxes"("sprintId");
CREATE INDEX "timeboxes_date_idx" ON "timeboxes"("date");
CREATE UNIQUE INDEX "timeboxes_teamId_eventType_sprintId_date_key" ON "timeboxes"("teamId", "eventType", "sprintId", "date");

-- Partial unique indexes to enforce exactly one Product Owner / Scrum Master per team.
-- (On a fresh database there is no data to deduplicate, so these are created directly.)
CREATE UNIQUE INDEX "team_members_single_product_owner_idx" ON "team_members"("teamId") WHERE "role" = 'PRODUCT_OWNER';
CREATE UNIQUE INDEX "team_members_single_scrum_master_idx" ON "team_members"("teamId") WHERE "role" = 'SCRUM_MASTER';

-- Dashboard-related composite indexes added by the lifecycle enhancement
CREATE INDEX "increments_teamId_status_createdAt_idx" ON "increments"("teamId", "status", "createdAt");
CREATE INDEX "impediments_teamId_status_createdAt_idx" ON "impediments"("teamId", "status", "createdAt");
CREATE INDEX "retro_action_items_ownerId_status_dueDate_idx" ON "retro_action_items"("ownerId", "status", "dueDate");

-- ============================================
-- FOREIGN KEYS
-- ============================================
ALTER TABLE "teams" ADD CONSTRAINT "teams_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_goals" ADD CONSTRAINT "product_goals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_goals" ADD CONSTRAINT "product_goals_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_backlog_items" ADD CONSTRAINT "product_backlog_items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_backlog_items" ADD CONSTRAINT "product_backlog_items_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "product_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_backlog_items" ADD CONSTRAINT "product_backlog_items_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "product_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_backlog_items" ADD CONSTRAINT "sprint_backlog_items_pbiId_fkey" FOREIGN KEY ("pbiId") REFERENCES "product_backlog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_backlog_items" ADD CONSTRAINT "sprint_backlog_items_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_backlog_changes" ADD CONSTRAINT "sprint_backlog_changes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sprint_backlog_changes" ADD CONSTRAINT "sprint_backlog_changes_pbiId_fkey" FOREIGN KEY ("pbiId") REFERENCES "product_backlog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_backlog_changes" ADD CONSTRAINT "sprint_backlog_changes_sprintBacklogItemId_fkey" FOREIGN KEY ("sprintBacklogItemId") REFERENCES "sprint_backlog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sprint_backlog_changes" ADD CONSTRAINT "sprint_backlog_changes_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_pbiId_fkey" FOREIGN KEY ("pbiId") REFERENCES "product_backlog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_scrums" ADD CONSTRAINT "daily_scrums_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_scrum_backlog_items" ADD CONSTRAINT "daily_scrum_backlog_items_dailyScrumId_fkey" FOREIGN KEY ("dailyScrumId") REFERENCES "daily_scrums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_scrum_backlog_items" ADD CONSTRAINT "daily_scrum_backlog_items_sprintBacklogItemId_fkey" FOREIGN KEY ("sprintBacklogItemId") REFERENCES "sprint_backlog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_scrum_participants" ADD CONSTRAINT "daily_scrum_participants_dailyScrumId_fkey" FOREIGN KEY ("dailyScrumId") REFERENCES "daily_scrums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_scrum_participants" ADD CONSTRAINT "daily_scrum_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "burndown_data" ADD CONSTRAINT "burndown_data_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "impediments" ADD CONSTRAINT "impediments_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "impediments" ADD CONSTRAINT "impediments_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "impediments" ADD CONSTRAINT "impediments_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "impediments" ADD CONSTRAINT "impediments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "definition_of_done" ADD CONSTRAINT "definition_of_done_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dod_items" ADD CONSTRAINT "dod_items_dodId_fkey" FOREIGN KEY ("dodId") REFERENCES "definition_of_done"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dod_checklist_verifications" ADD CONSTRAINT "dod_checklist_verifications_dodItemId_fkey" FOREIGN KEY ("dodItemId") REFERENCES "dod_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dod_checklist_verifications" ADD CONSTRAINT "dod_checklist_verifications_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "definition_of_ready" ADD CONSTRAINT "definition_of_ready_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dor_items" ADD CONSTRAINT "dor_items_dorId_fkey" FOREIGN KEY ("dorId") REFERENCES "definition_of_ready"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dor_checklist_verifications" ADD CONSTRAINT "dor_checklist_verifications_dorItemId_fkey" FOREIGN KEY ("dorItemId") REFERENCES "dor_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dor_checklist_verifications" ADD CONSTRAINT "dor_checklist_verifications_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "increments" ADD CONSTRAINT "increments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "increments" ADD CONSTRAINT "increments_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "increments" ADD CONSTRAINT "increments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "increment_pbis" ADD CONSTRAINT "increment_pbis_incrementId_fkey" FOREIGN KEY ("incrementId") REFERENCES "increments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "increment_pbis" ADD CONSTRAINT "increment_pbis_pbiId_fkey" FOREIGN KEY ("pbiId") REFERENCES "product_backlog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_reviews" ADD CONSTRAINT "sprint_reviews_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sprint_reviews" ADD CONSTRAINT "sprint_reviews_incrementId_fkey" FOREIGN KEY ("incrementId") REFERENCES "increments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_reviews" ADD CONSTRAINT "sprint_reviews_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_reviews" ADD CONSTRAINT "sprint_reviews_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_attendees" ADD CONSTRAINT "review_attendees_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "sprint_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stakeholder_feedback" ADD CONSTRAINT "stakeholder_feedback_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stakeholder_feedback" ADD CONSTRAINT "stakeholder_feedback_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "sprint_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "backlog_adjustments" ADD CONSTRAINT "backlog_adjustments_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "backlog_adjustments" ADD CONSTRAINT "backlog_adjustments_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "sprint_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_retrospectives" ADD CONSTRAINT "sprint_retrospectives_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sprint_retrospectives" ADD CONSTRAINT "sprint_retrospectives_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_retrospectives" ADD CONSTRAINT "sprint_retrospectives_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retro_attendees" ADD CONSTRAINT "retro_attendees_retrospectiveId_fkey" FOREIGN KEY ("retrospectiveId") REFERENCES "sprint_retrospectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retrospective_items" ADD CONSTRAINT "retrospective_items_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "retrospective_items" ADD CONSTRAINT "retrospective_items_retrospectiveId_fkey" FOREIGN KEY ("retrospectiveId") REFERENCES "sprint_retrospectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retro_item_votes" ADD CONSTRAINT "retro_item_votes_retrospectiveItemId_fkey" FOREIGN KEY ("retrospectiveItemId") REFERENCES "retrospective_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retro_item_votes" ADD CONSTRAINT "retro_item_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retro_action_items" ADD CONSTRAINT "retro_action_items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "retro_action_items" ADD CONSTRAINT "retro_action_items_retrospectiveId_fkey" FOREIGN KEY ("retrospectiveId") REFERENCES "sprint_retrospectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_configurations" ADD CONSTRAINT "sprint_configurations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generated_sprints" ADD CONSTRAINT "generated_sprints_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "generated_sprints" ADD CONSTRAINT "generated_sprints_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "workflow_states" ADD CONSTRAINT "workflow_states_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_fromStateId_fkey" FOREIGN KEY ("fromStateId") REFERENCES "workflow_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_toStateId_fkey" FOREIGN KEY ("toStateId") REFERENCES "workflow_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "status_change_history" ADD CONSTRAINT "status_change_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "status_change_history" ADD CONSTRAINT "status_change_history_fromStateId_fkey" FOREIGN KEY ("fromStateId") REFERENCES "workflow_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "status_change_history" ADD CONSTRAINT "status_change_history_toStateId_fkey" FOREIGN KEY ("toStateId") REFERENCES "workflow_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "status_change_history" ADD CONSTRAINT "status_change_history_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "workflow_transitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "status_change_history" ADD CONSTRAINT "status_change_history_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduled_deletions" ADD CONSTRAINT "scheduled_deletions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for the scrum lifecycle enhancement tables
ALTER TABLE "increment_integration_tests" ADD CONSTRAINT "increment_integration_tests_currentIncrementId_fkey" FOREIGN KEY ("currentIncrementId") REFERENCES "increments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "increment_integration_tests" ADD CONSTRAINT "increment_integration_tests_priorIncrementId_fkey" FOREIGN KEY ("priorIncrementId") REFERENCES "increments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "increment_integration_tests" ADD CONSTRAINT "increment_integration_tests_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_goal_snapshots" ADD CONSTRAINT "product_goal_snapshots_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "product_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_goal_snapshots" ADD CONSTRAINT "product_goal_snapshots_sprintReviewId_fkey" FOREIGN KEY ("sprintReviewId") REFERENCES "sprint_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_health_checks" ADD CONSTRAINT "team_health_checks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_health_checks" ADD CONSTRAINT "team_health_checks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "team_health_check_responses" ADD CONSTRAINT "team_health_check_responses_healthCheckId_fkey" FOREIGN KEY ("healthCheckId") REFERENCES "team_health_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_health_check_responses" ADD CONSTRAINT "team_health_check_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Timebox foreign keys
ALTER TABLE "timeboxes" ADD CONSTRAINT "timeboxes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timeboxes" ADD CONSTRAINT "timeboxes_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- CHECK CONSTRAINTS FOR BUSINESS RULES
-- ============================================
ALTER TABLE "sprints" ADD CONSTRAINT "chk_sprints_dates" CHECK ("startDate" < "endDate");
ALTER TABLE "tasks" ADD CONSTRAINT "chk_tasks_hours" CHECK ("estimatedHours" >= 0 AND "remainingHours" >= 0);
ALTER TABLE "product_backlog_items" ADD CONSTRAINT "chk_pbi_values" CHECK ("storyPoints" >= 0 AND "businessValue" >= 0);
ALTER TABLE "increments" ADD CONSTRAINT "chk_increments_points" CHECK ("totalStoryPoints" >= 0);
ALTER TABLE "burndown_data" ADD CONSTRAINT "chk_burndown_remaining" CHECK ("idealRemaining" >= 0);

-- ============================================
-- GIN INDEXES FOR JSONB AND ARRAY COLUMNS
-- ============================================
CREATE INDEX "product_backlog_items_labels_idx" ON "product_backlog_items" USING GIN ("labels");
CREATE INDEX "status_change_history_metadata_idx" ON "status_change_history" USING GIN ("metadata" jsonb_path_ops);
CREATE INDEX "notifications_data_idx" ON "notifications" USING GIN ("data" jsonb_path_ops);

-- ============================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ============================================
CREATE INDEX "sprints_active_idx" ON "sprints"("teamId") WHERE "status" = 'ACTIVE';
CREATE INDEX "impediments_open_idx" ON "impediments"("teamId") WHERE "status" IN ('OPEN', 'IN_PROGRESS');
CREATE INDEX "notifications_unread_idx" ON "notifications"("userId") WHERE "isRead" = false;
