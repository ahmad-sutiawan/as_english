import { prisma } from "@/lib/db";
import { getItem, getModule, getModules } from "@/lib/content";
import type { PersonaId } from "@/lib/persona";

export type MemorySource = "module" | "build" | "speak";
export type MemoryResult = "exact" | "near" | "wrong";

const INTERVALS = [1, 3, 7, 16, 35] as const;

function jakartaKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function intervalForStreak(streak: number): number {
  if (streak <= 1) return INTERVALS[0];
  const index = Math.min(streak - 1, INTERVALS.length - 1);
  return INTERVALS[index];
}

export async function getLearnerState(userId: string, persona: PersonaId) {
  return prisma.learnerState.upsert({
    where: { userId_persona: { userId, persona } },
    create: { userId, persona },
    update: {},
  });
}

export async function markPlacementPassed(userId: string, persona: PersonaId) {
  return prisma.learnerState.upsert({
    where: { userId_persona: { userId, persona } },
    create: { userId, persona, placementPassed: true },
    update: { placementPassed: true },
  });
}

export async function recordItemMemory(opts: {
  userId: string;
  persona: PersonaId;
  source: MemorySource;
  itemId: string;
  moduleId?: string;
  result: MemoryResult;
}) {
  const existing = await prisma.itemMemory.findUnique({
    where: {
      userId_persona_source_itemId: {
        userId: opts.userId,
        persona: opts.persona,
        source: opts.source,
        itemId: opts.itemId,
      },
    },
  });

  const now = new Date();
  let correctStreak = 0;
  let lapseCount = existing?.lapseCount ?? 0;
  let intervalDays = 0;
  let nextReviewAt = now;
  let graduated = false;
  let lastResult = opts.result;

  if (opts.result === "exact") {
    correctStreak = (existing?.correctStreak ?? 0) + 1;
    const previous = existing?.intervalDays ?? 0;
    if (previous >= 35) {
      graduated = true;
      intervalDays = 35;
      nextReviewAt = addDays(now, 3650);
    } else {
      intervalDays = intervalForStreak(correctStreak);
      nextReviewAt = addDays(now, intervalDays);
    }
  } else {
    lapseCount += 1;
    const failedToday =
      existing &&
      existing.lastResult !== "exact" &&
      jakartaKey(existing.updatedAt) === jakartaKey(now);
    nextReviewAt = failedToday ? addDays(now, 1) : now;
    lastResult = opts.result;
  }

  return prisma.itemMemory.upsert({
    where: {
      userId_persona_source_itemId: {
        userId: opts.userId,
        persona: opts.persona,
        source: opts.source,
        itemId: opts.itemId,
      },
    },
    create: {
      userId: opts.userId,
      persona: opts.persona,
      source: opts.source,
      itemId: opts.itemId,
      moduleId: opts.moduleId ?? "",
      correctStreak,
      lapseCount,
      intervalDays,
      nextReviewAt,
      lastResult,
      graduated,
    },
    update: {
      moduleId: opts.moduleId ?? existing?.moduleId ?? "",
      correctStreak,
      lapseCount,
      intervalDays,
      nextReviewAt,
      lastResult,
      graduated,
    },
  });
}

/** Pull two sibling module items that share a tag into today's queue. */
export async function scheduleSiblingItems(opts: {
  userId: string;
  persona: PersonaId;
  moduleId: string;
  itemId: string;
}) {
  const item = getItem(opts.moduleId, opts.itemId, opts.persona);
  if (!item?.tags.length) return;

  const siblings: { moduleId: string; itemId: string }[] = [];
  for (const meta of getModules(opts.persona)) {
    if (meta.status !== "ready") continue;
    const mod = getModule(meta.id, opts.persona);
    if (!mod) continue;
    for (const candidate of mod.items) {
      if (candidate.id === opts.itemId && mod.id === opts.moduleId) continue;
      if (candidate.kind === "dialogue") continue;
      if (!candidate.tags.some((tag) => item.tags.includes(tag))) continue;
      siblings.push({ moduleId: mod.id, itemId: candidate.id });
      if (siblings.length >= 2) break;
    }
    if (siblings.length >= 2) break;
  }

  const now = new Date();
  for (const sibling of siblings) {
    const key = {
      userId: opts.userId,
      persona: opts.persona,
      source: "module",
      itemId: sibling.itemId,
    };
    const existing = await prisma.itemMemory.findUnique({
      where: { userId_persona_source_itemId: key },
    });
    if (existing?.graduated) continue;
    if (existing && existing.nextReviewAt <= now) continue;
    await prisma.itemMemory.upsert({
      where: { userId_persona_source_itemId: key },
      create: {
        ...key,
        moduleId: sibling.moduleId,
        nextReviewAt: now,
        lastResult: "sibling",
      },
      update: {
        moduleId: sibling.moduleId,
        nextReviewAt: now,
        graduated: false,
        lastResult: "sibling",
      },
    });
  }
}

export async function countDue(userId: string, persona: PersonaId) {
  return prisma.itemMemory.count({
    where: {
      userId,
      persona,
      graduated: false,
      nextReviewAt: { lte: new Date() },
    },
  });
}

export async function listDue(userId: string, persona: PersonaId, limit = 20) {
  return prisma.itemMemory.findMany({
    where: {
      userId,
      persona,
      graduated: false,
      nextReviewAt: { lte: new Date() },
    },
    orderBy: [{ lapseCount: "desc" }, { nextReviewAt: "asc" }],
    take: limit,
  });
}
