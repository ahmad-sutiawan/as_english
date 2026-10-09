import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const CLIENT_MARK = "persona-v1";

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  (client as PrismaClient & { __asMark?: string }).__asMark = CLIENT_MARK;
  return client;
}

function isClientCurrent(client: PrismaClient): boolean {
  // After schema changes, a cached global client can miss new delegates.
  const c = client as PrismaClient & {
    __asMark?: string;
    quickStats?: { upsert?: unknown };
    speakStats?: { upsert?: unknown };
  };
  return (
    c.__asMark === CLIENT_MARK &&
    typeof c.quickStats?.upsert === "function" &&
    typeof c.speakStats?.upsert === "function"
  );
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && isClientCurrent(cached)) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
