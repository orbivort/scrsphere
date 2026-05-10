# Data Model

This document provides a comprehensive overview of the Scrsphere data model, including entity-relationship diagrams, database schema, data flows, and migration strategy.

## Table of Contents

- [Database Overview](#database-overview)
- [Entity-Relationship Diagram](#entity-relationship-diagram)
- [Core Entities](#core-entities)
- [Relationships](#relationships)
- [Indexes and Performance](#indexes-and-performance)
- [Data Integrity](#data-integrity)
- [Migration Strategy](#migration-strategy)

## Database Overview

### Technology Stack

- **Database**: PostgreSQL 18+
- **ORM**: Prisma 7.x
- **Connection Pooling**: Prisma built-in pooling
- **Migration Tool**: Prisma Migrate

### Database Statistics

- **Total Tables**: 30+
- **Core Tables**: 15
- **Relationship Tables**: 10
- **Configuration Tables**: 5

### Schema Organization

The database schema is organized into logical groups:

1. **User Management**: Users, sessions, tokens
2. **Team Management**: Teams, members, roles
3. **Product Management**: Goals, backlog items
4. **Sprint Management**: Sprints, tasks, impediments
5. **Review & Retrospective**: Reviews, retrospectives, increments
6. **Workflow & Configuration**: Workflows, states, transitions
7. **System**: Notifications, audit logs

## Entity-Relationship Diagram

### High-Level ER Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐       ┌─────────────┐
│    Team     │◄──────│Team Member  │
└──────┬──────┘       └─────────────┘
       │
       │ 1:N
       ├─────────────────┬─────────────────┬─────────────────┐
       ▼                 ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│Product Goal │   │   Sprint    │   │ Impediment  │   │    DoD/DoR  │
└──────┬──────┘   └──────┬──────┘   └─────────────┘   └─────────────┘
       │                 │
       │ 1:N            │ 1:N
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Backlog    │   │    Task     │
│    Item     │   └─────────────┘
└──────┬──────┘
       │
       │ N:M
       ▼
┌─────────────┐
│  Increment  │
└─────────────┘
```

### Detailed ER Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USER MANAGEMENT                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐  │
│  │     User     │         │ RefreshToken │         │Notification  │  │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤  │
│  │ id (PK)      │◄────────│ userId (FK)  │         │ userId (FK)  │  │
│  │ email        │    1:N  │ token        │         │ type         │  │
│  │ password     │         │ expiresAt    │         │ title        │  │
│  │ firstName    │         └──────────────┘         │ message      │  │
│  │ lastName     │                                  │ isRead       │  │
│  │ avatarUrl    │         ┌──────────────┐         └──────────────┘  │
│  │ createdAt    │         │ScheduledDeletion│                        │
│  │ updatedAt    │         ├──────────────┤                           │
│  └──────────────┘         │ userId (FK)  │                           │
│                           │ scheduledAt  │                           │
│                           │ status       │                           │
│                           └──────────────┘                           │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                          TEAM MANAGEMENT                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌──────────────┐                           │
│  │     Team     │◄────────│ TeamMember   │                           │
│  ├──────────────┤    1:N  ├──────────────┤                           │
│  │ id (PK)      │         │ id (PK)      │                           │
│  │ name         │         │ teamId (FK)  │                           │
│  │ description  │         │ userId (FK)  │                           │
│  │ createdAt    │         │ role         │                           │
│  │ createdBy    │         │ joinedAt     │                           │
│  └──────────────┘         └──────────────┘                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        PRODUCT MANAGEMENT                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌──────────────┐                           │
│  │ ProductGoal  │◄────────│ BacklogItem  │                           │
│  ├──────────────┤    1:N  ├──────────────┤                           │
│  │ id (PK)      │         │ id (PK)      │                           │
│  │ teamId (FK)  │         │ teamId (FK)  │                           │
│  │ title        │         │ goalId (FK)  │                           │
│  │ description  │         │ title        │                           │
│  │ status       │         │ description  │                           │
│  │ targetDate   │         │ priority     │                           │
│  │ successMet.  │         │ storyPoints  │                           │
│  └──────────────┘         │ status       │                           │
│                           │ labels       │                           │
│                           └──────────────┘                           │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         SPRINT MANAGEMENT                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐  │
│  │    Sprint    │◄────────│     Task     │         │ DailyUpdate  │  │
│  ├──────────────┤    1:N  ├──────────────┤         ├──────────────┤  │
│  │ id (PK)      │         │ id (PK)      │         │ id (PK)      │  │
│  │ teamId (FK)  │         │ sprintId (FK)│         │ sprintId (FK)│  │
│  │ goalId (FK)  │         │ pbiId (FK)   │         │ userId (FK)  │  │
│  │ name         │         │ title        │         │ updateDate   │  │
│  │ startDate    │         │ assigneeId   │         │ yesterdayWork│  │
│  │ endDate      │         │ status       │         │ todayWork    │  │
│  │ sprintGoal   │         │ estimatedHrs │         │ impediment   │  │
│  │ status       │         │ remainingHrs │         └──────────────┘  │
│  └──────────────┘         └──────────────┘                           │
│                                                                      │
│  ┌──────────────┐         ┌──────────────┐                           │
│  │  Impediment  │         │BurndownData  │                           │
│  ├──────────────┤         ├──────────────┤                           │
│  │ id (PK)      │         │ id (PK)      │                           │
│  │ teamId (FK)  │         │ sprintId (FK)│                           │
│  │ sprintId (FK)│         │ date         │                           │
│  │ title        │         │ idealRemain  │                           │
│  │ description  │         │ actualRemain │                           │
│  │ status       │         └──────────────┘                           │
│  └──────────────┘                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

## Core Entities

### 1. User

**Purpose**: Store user account information and profile data.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| email | String | Unique, Required | User email address |
| password | String | Required | Hashed password (bcrypt) |
| firstName | String | Required | User first name |
| lastName | String | Required | User last name |
| avatarUrl | String | Optional | Avatar URL |
| createdAt | Timestamp | Auto | Creation timestamp |
| updatedAt | Timestamp | Auto | Update timestamp |
| marketingOptIn | Boolean | Default: false | Marketing consent |
| termsAcceptedAt | Timestamp | Optional | Terms acceptance date |

**Indexes**:

- Primary key on `id`
- Unique index on `email`

**Relationships**:

- Has many `TeamMember` records
- Has many `RefreshToken` records
- Has many `Notification` records
- Has many `Task` assignments

### 2. Team

**Purpose**: Define teams and their settings.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | String | Unique, Required | Team name |
| description | String | Optional | Team description |
| createdAt | Timestamp | Auto | Creation timestamp |
| createdBy | UUID | FK (User) | Creator user ID |
| updatedAt | Timestamp | Auto | Update timestamp |

**Indexes**:

- Primary key on `id`
- Unique index on `name`
- Index on `createdBy`

**Relationships**:

- Has many `TeamMember` records
- Has many `ProductGoal` records
- Has many `Sprint` records
- Has one `DefinitionOfDone`
- Has one `DefinitionOfReady`

### 3. TeamMember

**Purpose**: Manage team membership and roles.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| teamId | UUID | FK (Team) | Team reference |
| userId | UUID | FK (User) | User reference |
| role | Enum | Required | User role |
| joinedAt | Timestamp | Auto | Join timestamp |

**Roles**:

- `PRODUCT_OWNER`: Product backlog management
- `SCRUM_MASTER`: Sprint and team management
- `DEVELOPER`: Task execution

**Indexes**:

- Primary key on `id`
- Unique index on `(teamId, userId)`
- Index on `userId`

**Relationships**:

- Belongs to `Team`
- Belongs to `User`

### 4. ProductGoal

**Purpose**: Define strategic product goals.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| teamId | UUID | FK (Team) | Team reference |
| title | String | Required | Goal title |
| description | String | Optional | Goal description |
| status | Enum | Required | Goal status |
| targetDate | Timestamp | Optional | Target completion date |
| successMetrics | String | Optional | Success criteria |
| strategicAlignment | String | Optional | Strategic context |

**Statuses**:

- `NEW`: Newly created
- `ACTIVE`: Currently being worked on
- `COMPLETED`: Successfully completed
- `ABANDONED`: No longer pursued

**Indexes**:

- Primary key on `id`
- Index on `teamId`
- Index on `status`
- Index on `(teamId, status)`

### 5. ProductBacklogItem

**Purpose**: Manage product backlog items.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| teamId | UUID | FK (Team) | Team reference |
| goalId | UUID | FK (ProductGoal) | Goal reference |
| title | String | Required | Item title |
| description | String | Optional | Item description |
| priority | Enum | Required | MoSCoW priority |
| businessValue | Int | Optional | Business value score |
| storyPoints | Int | Optional | Story point estimate |
| status | Enum | Required | Item status |
| labels | String[] | Optional | Item labels |
| acceptanceCriteria | String | Optional | Acceptance criteria |

**Priorities (MoSCoW)**:

- `MUST_HAVE`: Critical for delivery
- `SHOULD_HAVE`: Important but not critical
- `COULD_HAVE`: Desirable if time permits
- `WONT_HAVE`: Not in current scope

**Statuses**:

- `NEW`: Newly created
- `REFINED`: Refined and estimated
- `READY`: Ready for sprint
- `IN_PROGRESS`: Currently in sprint
- `DONE`: Completed

**Indexes**:

- Primary key on `id`
- Index on `teamId`
- Index on `status`
- Index on `priority`
- Index on `(teamId, status)`
- Index on `(teamId, status, priority)`

### 6. Sprint

**Purpose**: Define and manage sprints.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| teamId | UUID | FK (Team) | Team reference |
| goalId | UUID | FK (ProductGoal) | Goal reference |
| name | String | Required | Sprint name |
| startDate | Timestamp | Required | Sprint start date |
| endDate | Timestamp | Required | Sprint end date |
| sprintGoal | String | Optional | Sprint goal |
| status | Enum | Required | Sprint status |
| cancellationReason | String | Optional | Cancellation reason |

**Statuses**:

- `PLANNED`: Planned but not started
- `ACTIVE`: Currently running
- `COMPLETED`: Successfully completed
- `CANCELLED`: Cancelled

**Indexes**:

- Primary key on `id`
- Index on `teamId`
- Index on `status`
- Index on `startDate`
- Index on `(teamId, status)`
- Index on `(teamId, startDate)`

### 7. Task

**Purpose**: Manage sprint tasks.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| sprintId | UUID | FK (Sprint) | Sprint reference |
| pbiId | UUID | FK (ProductBacklogItem) | Backlog item reference |
| title | String | Required | Task title |
| description | String | Optional | Task description |
| assigneeId | UUID | FK (User) | Assignee reference |
| status | Enum | Required | Task status |
| estimatedHours | Float | Optional | Estimated hours |
| remainingHours | Float | Optional | Remaining hours |

**Statuses**:

- `TODO`: Not started
- `IN_PROGRESS`: Currently being worked on
- `DONE`: Completed

**Indexes**:

- Primary key on `id`
- Index on `sprintId`
- Index on `pbiId`
- Index on `assigneeId`
- Index on `status`
- Index on `(sprintId, status)`

### 8. DefinitionOfDone / DefinitionOfReady

**Purpose**: Define team-specific checklists.

**Fields (DoD/DoR)**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| teamId | UUID | FK (Team), Unique | Team reference |
| version | Int | Default: 1 | Version number |
| createdAt | Timestamp | Auto | Creation timestamp |
| updatedAt | Timestamp | Auto | Update timestamp |

**Fields (DoDItem/DoRItem)**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| dodId/dorId | UUID | FK | DoD/DoR reference |
| description | String | Required | Item description |
| category | String | Optional | Item category |
| isActive | Boolean | Default: true | Active status |
| order | Int | Required | Display order |

## Relationships

### One-to-Many Relationships

```
User (1) ──► (N) RefreshToken
User (1) ──► (N) Notification
Team (1) ──► (N) TeamMember
Team (1) ──► (N) ProductGoal
Team (1) ──► (N) Sprint
ProductGoal (1) ──► (N) ProductBacklogItem
Sprint (1) ──► (N) Task
Sprint (1) ──► (N) DailyUpdate
```

### Many-to-Many Relationships

```
ProductBacklogItem (N) ◄──► (N) Increment
  └─ Through: IncrementPBI (junction table)

Sprint (N) ◄──► (N) ProductBacklogItem
  └─ Through: SprintBacklogItem (junction table)
```

### One-to-One Relationships

```
Team (1) ──► (1) DefinitionOfDone
Team (1) ──► (1) DefinitionOfReady
Sprint (1) ──► (1) SprintRetrospective
Sprint (1) ──► (1) SprintReview
```

## Indexes and Performance

### Primary Indexes

All tables have primary key indexes on their `id` field (UUID).

### Foreign Key Indexes

All foreign key fields are indexed for efficient joins:

- `userId` in all related tables
- `teamId` in all team-related tables
- `sprintId` in all sprint-related tables

### Composite Indexes

Strategic composite indexes for common queries:

```sql
-- Team-based queries
CREATE INDEX idx_backlog_team_status ON product_backlog_items(teamId, status);
CREATE INDEX idx_sprint_team_status ON sprints(teamId, status);
CREATE INDEX idx_tasks_sprint_status ON tasks(sprintId, status);

-- User-based queries
CREATE INDEX idx_notifications_user_read ON notifications(userId, isRead);
CREATE INDEX idx_sessions_user_activity ON refresh_tokens(userId, lastActivityAt);

-- Date-based queries
CREATE INDEX idx_sprint_dates ON sprints(startDate, endDate);
CREATE INDEX idx_daily_updates_date ON daily_updates(updateDate);
```

### Query Optimization Examples

**Efficient Team Backlog Query**:

```typescript
const backlog = await prisma.productBacklogItem.findMany({
  where: {
    teamId,
    status: { in: ['NEW', 'REFINED', 'READY'] },
  },
  include: {
    goal: { select: { id: true, title: true } },
  },
  orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
});
```

**Efficient Sprint Board Query**:

```typescript
const sprintBoard = await prisma.sprint.findUnique({
  where: { id: sprintId },
  include: {
    tasks: {
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        pbi: { select: { id: true, title: true } },
      },
      orderBy: { status: 'asc' },
    },
  },
});
```

## Data Integrity

### Constraints

**Foreign Key Constraints**:

```sql
-- Cascade on delete for dependent records
ALTER TABLE team_members
  ADD CONSTRAINT fk_team_members_team
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE;

-- Set null on delete for optional references
ALTER TABLE product_backlog_items
  ADD CONSTRAINT fk_backlog_goal
  FOREIGN KEY (goalId) REFERENCES product_goals(id) ON DELETE SET NULL;
```

**Unique Constraints**:

```sql
-- Ensure unique team membership
ALTER TABLE team_members
  ADD CONSTRAINT unique_team_member UNIQUE (teamId, userId);

-- Ensure unique email
ALTER TABLE users
  ADD CONSTRAINT unique_user_email UNIQUE (email);
```

**Check Constraints**:

```sql
-- Validate sprint dates
ALTER TABLE sprints
  ADD CONSTRAINT chk_sprint_dates
  CHECK (endDate > startDate);

-- Validate story points (Fibonacci)
ALTER TABLE product_backlog_items
  ADD CONSTRAINT chk_story_points
  CHECK (storyPoints IN (1, 2, 3, 5, 8, 13, 21, 34, 55, 89) OR storyPoints IS NULL);
```

### Data Validation

**Application-Level Validation**:

```typescript
// Using Zod for validation
const createSprintSchema = z
  .object({
    name: z.string().min(1).max(100),
    startDate: z.date(),
    endDate: z.date(),
    sprintGoal: z.string().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
  });
```

## Migration Strategy

### Prisma Migrations

**Development Workflow**:

```bash
# Create migration
pnpm run db:migrate

# Apply to test database
pnpm run db:migrate:test

# Deploy to production
pnpm run db:migrate:prod
```

**Migration Files**:

```
prisma/
├── migrations/
│   ├── 20260415000000_initial/
│   │   └── migration.sql
│   ├── 20260416000000_add_notifications/
│   │   └── migration.sql
│   └── migration_lock.toml
└── schema.prisma
```

### Migration Best Practices

1. **Atomic Migrations**: Each migration should be atomic and reversible
2. **Data Preservation**: Always preserve existing data
3. **Index Creation**: Create indexes concurrently in production
4. **Testing**: Test migrations on staging before production
5. **Backup**: Always backup before production migrations

### Example Migration

```sql
-- Add notification retention configuration
-- Migration: 20260420000000_add_notification_config

-- Add new columns
ALTER TABLE "users" ADD COLUMN "notificationRetentionDays" INTEGER DEFAULT 30;

-- Add new table
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_notification_preferences" PRIMARY KEY ("id")
);

-- Add foreign key
ALTER TABLE "notification_preferences"
ADD CONSTRAINT "fk_notification_preferences_user"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index
CREATE INDEX "idx_notification_preferences_user" ON "notification_preferences"("userId");
```

---

**Last Updated**: 2026-05-10

**Related Documentation**:

- [System Architecture](./system-architecture.md)
- [Component Design](./component-design.md)
- [API Specifications](./api-specifications.md)
