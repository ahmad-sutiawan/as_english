import { prisma } from "@/lib/db";
import { getModule, getModules } from "@/lib/content";
import { getReviewQueue } from "@/lib/review";
import type { Difficulty, ExerciseItem } from "@/types/content";
import type { QuickCard } from "@/types/quick";

export type { QuickCard } from "@/types/quick";

export const QUICK_SESSION_SIZE = 8;
export const QUICK_HEARTS = 3;
export const QUICK_XP_CORRECT = 10;
export const QUICK_XP_PERFECT_BONUS = 20;

export type QuickLevelFilter = Difficulty | "all";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function toCard(moduleId: string, item: ExerciseItem): QuickCard | null {
  if (item.kind === "dialogue") return null;
  const mod = getModule(moduleId);
  if (!mod) return null;
  return {
    moduleId,
    moduleTitle: mod.title,
    moduleTitleId: mod.titleId,
    itemId: item.id,
    difficulty: item.difficulty,
    scenario: item.scenario,
    scenarioId: item.scenarioId,
    scenarioStructure: item.scenarioStructure,
    scenarioStructureId: item.scenarioStructureId,
    prompt: item.prompt,
    promptId: item.promptId,
    promptStructure: item.promptStructure,
    promptStructureId: item.promptStructureId,
    choices: item.choices.map((c) => ({
      key: c.key,
      text: c.text,
      textId: c.textId,
      structure: c.structure,
      structureId: c.structureId,
    })),
  };
}

/** Calendar date key in Asia/Jakarta (YYYY-MM-DD). */
export function jakartaDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function yesterdayJakartaKey(todayKey: string): string {
  const [y, m, day] = todayKey.split("-").map(Number);
  // noon UTC avoids DST edge; Jakarta has no DST
  const dt = new Date(Date.UTC(y, m - 1, day, 5, 0, 0));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return jakartaDateKey(dt);
}

export async function getOrCreateQuickStats(userId: string) {
  return prisma.quickStats.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function buildQuickSession(
  userId: string,
  level: QuickLevelFilter = "all",
): Promise<QuickCard[]> {
  const review = await getReviewQueue(userId, 40);
  const progressRows = await prisma.progress.findMany({
    where: { userId },
    select: { moduleId: true, completedItemIds: true },
  });
  const completed = new Map(
    progressRows.map((p) => [p.moduleId, new Set(p.completedItemIds)]),
  );

  const picked = new Set<string>();
  const cards: QuickCard[] = [];

  const tryAdd = (moduleId: string, itemId: string) => {
    const key = `${moduleId}::${itemId}`;
    if (picked.has(key) || cards.length >= QUICK_SESSION_SIZE) return;
    const item = getModule(moduleId)?.items.find((i) => i.id === itemId);
    if (!item) return;
    if (level !== "all" && item.difficulty !== level) return;
    const card = toCard(moduleId, item);
    if (!card) return;
    picked.add(key);
    cards.push(card);
  };

  for (const r of review) {
    tryAdd(r.moduleId, r.itemId);
    if (cards.length >= QUICK_SESSION_SIZE) break;
  }

  const notMastered: { moduleId: string; itemId: string }[] = [];
  const pool: { moduleId: string; itemId: string }[] = [];

  for (const meta of getModules()) {
    if (meta.status !== "ready") continue;
    const mod = getModule(meta.id);
    if (!mod) continue;
    const done = completed.get(mod.id) ?? new Set<string>();
    for (const item of mod.items) {
      if (item.kind === "dialogue") continue;
      if (level !== "all" && item.difficulty !== level) continue;
      const key = `${mod.id}::${item.id}`;
      if (picked.has(key)) continue;
      pool.push({ moduleId: mod.id, itemId: item.id });
      if (!done.has(item.id)) {
        notMastered.push({ moduleId: mod.id, itemId: item.id });
      }
    }
  }

  for (const row of shuffle(notMastered)) {
    tryAdd(row.moduleId, row.itemId);
    if (cards.length >= QUICK_SESSION_SIZE) break;
  }

  for (const row of shuffle(pool)) {
    tryAdd(row.moduleId, row.itemId);
    if (cards.length >= QUICK_SESSION_SIZE) break;
  }

  return cards;
}

export type CompleteQuickResult = {
  xpGained: number;
  xpTotal: number;
  streak: number;
  bestStreak: number;
};

export async function completeQuickSession(
  userId: string,
  opts: { correctCount: number; perfect: boolean },
): Promise<CompleteQuickResult> {
  const xpGained =
    opts.correctCount * QUICK_XP_CORRECT +
    (opts.perfect ? QUICK_XP_PERFECT_BONUS : 0);

  const today = jakartaDateKey();
  const stats = await getOrCreateQuickStats(userId);
  const lastKey = stats.lastPlayDate
    ? jakartaDateKey(stats.lastPlayDate)
    : null;

  let streak = stats.streak;
  if (lastKey === today) {
    // already played today — keep streak, still add XP
  } else if (lastKey === yesterdayJakartaKey(today)) {
    streak = stats.streak + 1;
  } else {
    streak = 1;
  }

  const bestStreak = Math.max(stats.bestStreak, streak);
  const updated = await prisma.quickStats.update({
    where: { userId },
    data: {
      xp: stats.xp + xpGained,
      streak,
      bestStreak,
      lastPlayDate: new Date(),
    },
  });

  return {
    xpGained,
    xpTotal: updated.xp,
    streak: updated.streak,
    bestStreak: updated.bestStreak,
  };
}
