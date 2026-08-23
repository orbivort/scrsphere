-- CreateEnum
CREATE TYPE "TimeboxStatus" AS ENUM ('IDLE', 'RUNNING', 'PAUSED');

-- CreateTable
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
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "timeboxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timeboxes_teamId_idx" ON "timeboxes"("teamId");

-- CreateIndex
CREATE INDEX "timeboxes_sprintId_idx" ON "timeboxes"("sprintId");

-- CreateIndex
CREATE INDEX "timeboxes_date_idx" ON "timeboxes"("date");

-- CreateIndex
CREATE UNIQUE INDEX "timeboxes_teamId_eventType_sprintId_date_key" ON "timeboxes"("teamId", "eventType", "sprintId", "date");

-- AddForeignKey
ALTER TABLE "timeboxes" ADD CONSTRAINT "timeboxes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeboxes" ADD CONSTRAINT "timeboxes_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
