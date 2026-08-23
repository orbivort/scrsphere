-- AlterTable
ALTER TABLE "timeboxes" ADD COLUMN     "concludedAt" TIMESTAMPTZ(3),
ADD COLUMN     "concludedElapsedMs" INTEGER;
