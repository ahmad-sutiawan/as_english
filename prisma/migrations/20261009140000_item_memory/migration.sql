-- CreateTable
CREATE TABLE "LearnerState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "placementPassed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL DEFAULT '',
    "correctStreak" INTEGER NOT NULL DEFAULT 0,
    "lapseCount" INTEGER NOT NULL DEFAULT 0,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "lastResult" TEXT NOT NULL,
    "graduated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearnerState_userId_persona_key" ON "LearnerState"("userId", "persona");

-- CreateIndex
CREATE INDEX "ItemMemory_userId_persona_nextReviewAt_idx" ON "ItemMemory"("userId", "persona", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "ItemMemory_userId_persona_source_itemId_key" ON "ItemMemory"("userId", "persona", "source", "itemId");

-- AddForeignKey
ALTER TABLE "LearnerState" ADD CONSTRAINT "LearnerState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMemory" ADD CONSTRAINT "ItemMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
