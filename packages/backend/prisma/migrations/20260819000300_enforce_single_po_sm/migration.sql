-- Enforce exactly one Product Owner / one Scrum Master per team at the DB level.
-- Demote duplicate PRODUCT_OWNER memberships to DEVELOPERS, keeping the earliest joinedAt.
UPDATE "team_members" SET "role" = 'DEVELOPERS' WHERE "id" IN (SELECT m."id" FROM (SELECT "id", ROW_NUMBER() OVER (PARTITION BY "teamId" ORDER BY "joinedAt" ASC, "id" ASC) AS rn FROM "team_members" WHERE "role" = 'PRODUCT_OWNER') m WHERE m.rn > 1);

-- Demote duplicate SCRUM_MASTER memberships to DEVELOPERS, keeping the earliest joinedAt.
UPDATE "team_members" SET "role" = 'DEVELOPERS' WHERE "id" IN (SELECT m."id" FROM (SELECT "id", ROW_NUMBER() OVER (PARTITION BY "teamId" ORDER BY "joinedAt" ASC, "id" ASC) AS rn FROM "team_members" WHERE "role" = 'SCRUM_MASTER') m WHERE m.rn > 1);

CREATE UNIQUE INDEX "team_members_single_product_owner_idx" ON "team_members"("teamId") WHERE "role" = 'PRODUCT_OWNER';
CREATE UNIQUE INDEX "team_members_single_scrum_master_idx" ON "team_members"("teamId") WHERE "role" = 'SCRUM_MASTER';
