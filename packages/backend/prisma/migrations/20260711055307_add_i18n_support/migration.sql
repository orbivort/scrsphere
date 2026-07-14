-- AlterTable: Add locale column to users table
ALTER TABLE "users" ADD COLUMN "locale" VARCHAR(10) NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "messageKey" TEXT,
ADD COLUMN     "params" JSONB;
