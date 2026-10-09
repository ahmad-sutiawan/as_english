-- AlterTable
ALTER TABLE "User" ADD COLUMN "activePersona" TEXT;

-- QuickStats: one row per user and persona. Existing rows stay on Kerja IT.
ALTER TABLE "QuickStats" ADD COLUMN "persona" TEXT NOT NULL DEFAULT 'it';
DROP INDEX "QuickStats_userId_key";
CREATE UNIQUE INDEX "QuickStats_userId_persona_key" ON "QuickStats"("userId", "persona");

-- BuildStats
ALTER TABLE "BuildStats" ADD COLUMN "persona" TEXT NOT NULL DEFAULT 'it';
DROP INDEX "BuildStats_userId_key";
CREATE UNIQUE INDEX "BuildStats_userId_persona_key" ON "BuildStats"("userId", "persona");

-- SpeakStats
ALTER TABLE "SpeakStats" ADD COLUMN "persona" TEXT NOT NULL DEFAULT 'it';
DROP INDEX "SpeakStats_userId_key";
CREATE UNIQUE INDEX "SpeakStats_userId_persona_key" ON "SpeakStats"("userId", "persona");
