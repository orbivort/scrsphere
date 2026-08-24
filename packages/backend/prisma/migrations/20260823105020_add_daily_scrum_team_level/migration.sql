-- CreateTable
CREATE TABLE "daily_scrums" (
    "id" UUID NOT NULL,
    "sprintId" UUID NOT NULL,
    "scrumDate" DATE NOT NULL,
    "progressNotes" TEXT,
    "adaptationsNotes" TEXT,
    "planForNextDay" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "daily_scrums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "daily_scrum_participants" (
    "id" UUID NOT NULL,
    "dailyScrumId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "daily_scrum_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_scrums_sprintId_scrumDate_idx" ON "daily_scrums"("sprintId", "scrumDate");

-- CreateIndex
CREATE INDEX "daily_scrums_scrumDate_idx" ON "daily_scrums"("scrumDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_scrums_sprintId_scrumDate_key" ON "daily_scrums"("sprintId", "scrumDate");

-- CreateIndex
CREATE INDEX "daily_scrum_backlog_items_dailyScrumId_idx" ON "daily_scrum_backlog_items"("dailyScrumId");

-- CreateIndex
CREATE INDEX "daily_scrum_backlog_items_sprintBacklogItemId_idx" ON "daily_scrum_backlog_items"("sprintBacklogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_scrum_backlog_items_dailyScrumId_sprintBacklogItemId_key" ON "daily_scrum_backlog_items"("dailyScrumId", "sprintBacklogItemId");

-- CreateIndex
CREATE INDEX "daily_scrum_participants_dailyScrumId_idx" ON "daily_scrum_participants"("dailyScrumId");

-- CreateIndex
CREATE INDEX "daily_scrum_participants_userId_idx" ON "daily_scrum_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_scrum_participants_dailyScrumId_userId_key" ON "daily_scrum_participants"("dailyScrumId", "userId");

-- AddForeignKey
ALTER TABLE "daily_scrums" ADD CONSTRAINT "daily_scrums_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_scrum_backlog_items" ADD CONSTRAINT "daily_scrum_backlog_items_dailyScrumId_fkey" FOREIGN KEY ("dailyScrumId") REFERENCES "daily_scrums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_scrum_backlog_items" ADD CONSTRAINT "daily_scrum_backlog_items_sprintBacklogItemId_fkey" FOREIGN KEY ("sprintBacklogItemId") REFERENCES "sprint_backlog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_scrum_participants" ADD CONSTRAINT "daily_scrum_participants_dailyScrumId_fkey" FOREIGN KEY ("dailyScrumId") REFERENCES "daily_scrums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_scrum_participants" ADD CONSTRAINT "daily_scrum_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
