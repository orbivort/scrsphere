-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SprintDuration" ADD VALUE 'ONE_WEEK';
ALTER TYPE "SprintDuration" ADD VALUE 'THREE_WEEKS';

-- DropIndex
DROP INDEX "notifications_data_idx";

-- DropIndex
DROP INDEX "product_backlog_items_labels_idx";

-- DropIndex
DROP INDEX "status_change_history_metadata_idx";
