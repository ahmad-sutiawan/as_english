-- CreateTable
CREATE TABLE "BuildStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuildStats_userId_key" ON "BuildStats"("userId");

-- AddForeignKey
ALTER TABLE "BuildStats" ADD CONSTRAINT "BuildStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
