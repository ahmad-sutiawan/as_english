import { prisma } from "@/lib/db";
import { getModule, getModules } from "@/lib/content";
import { getBuildDrill } from "@/lib/build";
import { getSpeakItem } from "@/lib/speak-content";
import { listDue } from "@/lib/memory";
import type { PersonaId } from "@/lib/persona";

export type ReviewItem = {
  moduleId: string;
  moduleTitle: string;
  moduleTitleId: string;
  itemId: string;
  prompt: string;
  promptId: string;
  reason: "salah_baru" | "belum_dikuasai" | "ulang_jadwal";
  reasonId: string;
  priority: number;
  wrongCount: number;
  correctStreak: number;
  href: string;
};

export type WeakTag = {
  tag: string;
  wrong: number;
  total: number;
  missRate: number;
};

type ItemStats = {
  moduleId: string;
  itemId: string;
  wrongCount: number;
  correctCount: number;
  lastCorrectAt: Date | null;
  lastWrongAt: Date | null;
  lastAttemptAt: Date | null;
  correctStreak: number;
};

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function intervalForStreak(streak: number): number {
  if (streak <= 1) return 1;
  if (streak === 2) return 3;
  if (streak === 3) return 7;
  return 14;
}

async function loadItemStats(userId: string): Promise<Map<string, ItemStats>> {
  const attempts = await prisma.attempt.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      moduleId: true,
      itemId: true,
      correct: true,
      createdAt: true,
    },
  });

  const map = new Map<string, ItemStats>();

  for (const a of attempts) {
    const key = `${a.moduleId}::${a.itemId}`;
    const cur =
      map.get(key) ??
      ({
        moduleId: a.moduleId,
        itemId: a.itemId,
        wrongCount: 0,
        correctCount: 0,
        lastCorrectAt: null,
        lastWrongAt: null,
        lastAttemptAt: null,
        correctStreak: 0,
      } satisfies ItemStats);

    cur.lastAttemptAt = a.createdAt;
    if (a.correct) {
      cur.correctCount += 1;
      cur.lastCorrectAt = a.createdAt;
      cur.correctStreak += 1;
    } else {
      cur.wrongCount += 1;
      cur.lastWrongAt = a.createdAt;
      cur.correctStreak = 0;
    }
    map.set(key, cur);
  }

  return map;
}

export async function getReviewQueue(
  userId: string,
  limit = 20,
  persona: PersonaId,
): Promise<ReviewItem[]> {
  const now = new Date();
  const dueMemory = await listDue(userId, persona, limit);
  const stats = await loadItemStats(userId);
  const progressRows = await prisma.progress.findMany({ where: { userId } });
  const completedByModule = new Map(
    progressRows.map((p) => [p.moduleId, new Set(p.completedItemIds)]),
  );

  const queue: ReviewItem[] = [];

  for (const row of dueMemory) {
    if (row.source === "module" && row.moduleId) {
      const mod = getModule(row.moduleId, persona);
      const item = mod?.items.find((entry) => entry.id === row.itemId);
      if (!mod || !item) continue;
      queue.push({
        moduleId: mod.id,
        moduleTitle: mod.title,
        moduleTitleId: mod.titleId,
        itemId: item.id,
        prompt: item.prompt,
        promptId: item.promptId,
        reason: row.lastResult === "sibling" ? "belum_dikuasai" : row.lastResult === "exact" ? "ulang_jadwal" : "salah_baru",
        reasonId:
          row.lastResult === "sibling"
            ? "Pola yang sama masih lemah"
            : row.lastResult === "near" || row.lastResult === "wrong"
              ? "Baru saja salah — ulangi sekarang"
              : `Jadwal ulang · ${row.intervalDays || 1} hari`,
        priority: 2000 - queue.length,
        wrongCount: row.lapseCount,
        correctStreak: row.correctStreak,
        href: `/learn/${mod.id}/${item.id}?from=review`,
      });
      continue;
    }
    if (row.source === "build") {
      const drill = getBuildDrill(row.itemId, persona);
      if (!drill) continue;
      queue.push({
        moduleId: "build",
        moduleTitle: "Build",
        moduleTitleId: "Susun",
        itemId: drill.id,
        prompt: drill.assemble.sentence,
        promptId: drill.meaningId,
        reason: "ulang_jadwal",
        reasonId: "Transformasi jatuh tempo",
        priority: 1800,
        wrongCount: row.lapseCount,
        correctStreak: row.correctStreak,
        href: `/build/play?theme=${drill.theme}`,
      });
      continue;
    }
    if (row.source === "speak") {
      const speak = getSpeakItem(row.itemId, persona);
      if (!speak) continue;
      queue.push({
        moduleId: "speak",
        moduleTitle: speak.category,
        moduleTitleId: "Bicara",
        itemId: speak.id,
        prompt: speak.scenario,
        promptId: speak.targetId,
        reason: "ulang_jadwal",
        reasonId: "Ucapan jatuh tempo",
        priority: 1700,
        wrongCount: row.lapseCount,
        correctStreak: row.correctStreak,
        href: "/speak/play",
      });
    }
  }

  for (const modMeta of getModules(persona)) {
    if (modMeta.status !== "ready") continue;
    const mod = getModule(modMeta.id, persona);
    if (!mod) continue;
    const completed = completedByModule.get(mod.id) ?? new Set<string>();

    for (const item of mod.items) {
      const key = `${mod.id}::${item.id}`;
      const st = stats.get(key);
      let reason: ReviewItem["reason"] | null = null;
      let priority = 0;
      let wrongCount = st?.wrongCount ?? 0;
      let correctStreak = st?.correctStreak ?? 0;

      const lastWrongAfterCorrect =
        st?.lastWrongAt &&
        (!st.lastCorrectAt || st.lastWrongAt > st.lastCorrectAt);

      if (lastWrongAfterCorrect) {
        reason = "salah_baru";
        priority = 1000 + wrongCount * 10;
      } else if (st && st.correctCount > 0 && st.lastCorrectAt) {
        const interval = intervalForStreak(st.correctStreak || 1);
        const age = daysBetween(now, st.lastCorrectAt);
        if (age >= interval) {
          reason = "ulang_jadwal";
          priority = 500 + age - interval;
        }
      } else if (!completed.has(item.id) && st && st.wrongCount > 0) {
        reason = "belum_dikuasai";
        priority = 700 + st.wrongCount * 5;
      }

      // Also surface never-tried items from modules the user already opened
      if (!reason && progressRows.some((p) => p.moduleId === mod.id)) {
        if (!st && !completed.has(item.id)) {
          // light suggestion only if queue still short — handled later by sorting
          reason = "belum_dikuasai";
          priority = 100;
          wrongCount = 0;
          correctStreak = 0;
        }
      }

      if (!reason) continue;
      if (queue.some((entry) => entry.moduleId === mod.id && entry.itemId === item.id)) {
        continue;
      }

      const reasonId =
        reason === "salah_baru"
          ? "Baru saja salah — ulangi sekarang"
          : reason === "ulang_jadwal"
            ? "Jadwal ulang (spaced repetition)"
            : "Belum dikuasai — lanjutkan mastery";

      queue.push({
        moduleId: mod.id,
        moduleTitle: mod.title,
        moduleTitleId: mod.titleId,
        itemId: item.id,
        prompt: item.prompt,
        promptId: item.promptId,
        reason,
        reasonId,
        priority,
        wrongCount,
        correctStreak,
        href: `/learn/${mod.id}/${item.id}?from=review`,
      });
    }
  }

  queue.sort((a, b) => b.priority - a.priority);
  return queue.slice(0, limit);
}

export async function getWeakTags(
  userId: string,
  persona: PersonaId,
  limit = 8,
): Promise<WeakTag[]> {
  const attempts = await prisma.attempt.findMany({
    where: { userId },
    select: { moduleId: true, itemId: true, correct: true },
  });

  const tagStats = new Map<string, { wrong: number; total: number }>();

  for (const a of attempts) {
    const item = getModule(a.moduleId, persona)?.items.find((i) => i.id === a.itemId);
    if (!item) continue;
    for (const tag of item.tags) {
      const cur = tagStats.get(tag) ?? { wrong: 0, total: 0 };
      cur.total += 1;
      if (!a.correct) cur.wrong += 1;
      tagStats.set(tag, cur);
    }
  }

  return Array.from(tagStats.entries())
    .map(([tag, s]) => ({
      tag,
      wrong: s.wrong,
      total: s.total,
      missRate: s.total > 0 ? s.wrong / s.total : 0,
    }))
    .filter((t) => t.total >= 2 && t.wrong > 0)
    .sort((a, b) => b.missRate - a.missRate || b.wrong - a.wrong)
    .slice(0, limit);
}

export async function getLearningStats(userId: string, persona: PersonaId) {
  const moduleIds = new Set(getModules(persona).map((mod) => mod.id));
  const [attempts, progressRows, reviewQueue, weakTags] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId, moduleId: { in: [...moduleIds] } },
      select: { correct: true },
    }),
    prisma.progress.findMany({
      where: { userId, moduleId: { in: [...moduleIds] } },
    }),
    getReviewQueue(userId, 50, persona),
    getWeakTags(userId, persona),
  ]);

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.correct).length;
  const mastered = progressRows.reduce(
    (sum, p) => sum + p.completedItemIds.length,
    0,
  );

  return {
    totalAttempts,
    correctAttempts,
    accuracy:
      totalAttempts > 0
        ? Math.round((correctAttempts / totalAttempts) * 100)
        : 0,
    mastered,
    dueCount: reviewQueue.length,
    reviewPreview: reviewQueue.slice(0, 5),
    weakTags,
  };
}
