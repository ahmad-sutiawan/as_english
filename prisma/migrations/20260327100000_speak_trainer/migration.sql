-- CreateTable
CREATE TABLE "SpeakStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "sessionsDone" INTEGER NOT NULL DEFAULT 0,
    "lastPlayDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "attempt1Score" INTEGER NOT NULL DEFAULT 0,
    "attempt2Score" INTEGER NOT NULL DEFAULT 0,
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    "nextReviewAt" TIMESTAMP(3),
    "lastTranscript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpeakStats_userId_key" ON "SpeakStats"("userId");

-- CreateIndex
CREATE INDEX "SpeakProgress_userId_nextReviewAt_idx" ON "SpeakProgress"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakProgress_userId_itemId_key" ON "SpeakProgress"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "SpeakStats" ADD CONSTRAINT "SpeakStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakProgress" ADD CONSTRAINT "SpeakProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
