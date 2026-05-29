-- Remove ADMINISTRATOR from UserRole enum
-- This migration removes the ADMINISTRATOR role as it is no longer used

-- First, update any existing ADMINISTRATOR role to PRODUCT_OWNER
UPDATE "team_members" SET "role" = 'PRODUCT_OWNER' WHERE "role" = 'ADMINISTRATOR';

-- Alter the enum to remove ADMINISTRATOR
-- PostgreSQL requires creating a new enum and swapping it
CREATE TYPE "UserRole_new" AS ENUM ('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER');

-- Update the column to use the new enum type
ALTER TABLE "team_members" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text)::"UserRole_new";

-- Drop the old enum
DROP TYPE "UserRole";

-- Rename the new enum to the original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
