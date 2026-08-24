-- Remove the legacy per-user DailyUpdate feature (replaced by the team-level,
-- goal-focused DailyScrum). This drops the daily_updates table, the
-- Impediment.dailyUpdateId column/FK/unique index, and the now-unused
-- DAILY_UPDATE_REMINDER notification enum value.

-- Drop the unique index and FK on impediments that reference daily_updates
-- before dropping the column, so the constraint no longer targets the dropped
-- table.
DROP INDEX IF EXISTS "impediments_dailyUpdateId_key";
ALTER TABLE "impediments" DROP CONSTRAINT IF EXISTS "impediments_dailyUpdateId_fkey";

-- Drop the legacy column on impediments.
ALTER TABLE "impediments" DROP COLUMN IF EXISTS "dailyUpdateId";

-- Remove legacy reminder notifications whose type is being removed from the enum.
DELETE FROM "notifications" WHERE "type" = 'DAILY_UPDATE_REMINDER';

-- Drop the daily_updates table (CASCADE removes its indexes and FKs).
DROP TABLE IF EXISTS "daily_updates" CASCADE;

-- Remove the DAILY_UPDATE_REMINDER value from the NotificationType enum.
-- PostgreSQL does not implement ALTER TYPE ... DROP VALUE (it raises
-- "dropping an enum value is not implemented"), so the enum is recreated
-- without the removed value. This is safe because NotificationType is only
-- used by notifications.type, which has no default value, and the legacy
-- DAILY_UPDATE_REMINDER rows were deleted above.
CREATE TYPE "NotificationType_new" AS ENUM (
  'TEAM_INVITATION',
  'TEAM_REMOVAL',
  'TASK_ASSIGNMENT',
  'IMPEDIMENT_ASSIGNMENT',
  'DAILY_SCRUM_SIGNAL',
  'TEAM_CREATED',
  'TEAM_UPDATED',
  'TEAM_DELETED',
  'DIRECT_MESSAGE',
  'ACCOUNT_DELETION_SCHEDULED',
  'ACCOUNT_DELETION_CANCELLED'
);

-- Re-point the notifications.type column to the new enum via text cast.
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new"
  USING ("type"::text::"NotificationType_new");

-- Swap the new enum into place and remove the old one.
DROP TYPE "NotificationType";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
