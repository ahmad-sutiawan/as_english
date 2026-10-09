import { prisma } from "@/lib/db";
import { getAllSpeakItems, getSpeakItem } from "@/lib/speak-content";
import { jakartaDateKey } from "@/lib/quick";
import { listDue } from "@/lib/memory";
import type { SpeakItem, SpeakLevel } from "@/types/speak";
import type { PersonaId } from "@/lib/persona";

export const SPEAK_XP_COMPLETE = 25;
export const SPEAK_XP_MASTERED = 15;

function yesterdayJakartaKey(todayKey: string): string {
  const [y, m, day] = todayKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day, 5, 0, 0));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return jakartaDateKey(dt);
}

export async function getOrCreateSpeakStats(userId: string, persona: PersonaId) {
  return prisma.speakStats.upsert({
    where: { userId_persona: { userId, persona } },
    create: { userId, persona },
    update: {},
  });
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function pickSpeakSessionItem(
  userId: string,
  persona: PersonaId,
  level: SpeakLevel | "all" = "all",
): Promise<SpeakItem | null> {
  const all = getAllSpeakItems(persona).filter(
    (i) => level === "all" || i.level === level,
  );
  if (!all.length) return null;

  const progress = await prisma.speakProgress.findMany({
    where: { userId },
  });
  const byId = new Map(progress.map((p) => [p.itemId, p]));
  const dueIds = new Set(
    (await listDue(userId, persona, 40))
      .filter((row) => row.source === "speak")
      .map((row) => row.itemId),
  );

  const due = all.filter((i) => dueIds.has(i.id));

  const neverTried = all.filter((i) => !byId.has(i.id));
  const weak = all.filter((i) => {
    const p = byId.get(i.id);
    return p && !p.mastered;
  });

  const pool = [...shuffle(due), ...shuffle(neverTried), ...shuffle(weak)];
  return pool[0] ?? shuffle(all)[0] ?? null;
}

export async function saveSpeakAttempt(opts: {
  userId: string;
  persona: PersonaId;
  itemId: string;
  phase: string;
  transcript: string;
  score: number;
  attemptSlot: 1 | 2;
  mastered: boolean;
}) {
  const item = getSpeakItem(opts.itemId, opts.persona);
  if (!item) return null;

  const existing = await prisma.speakProgress.findUnique({
    where: {
      userId_itemId: { userId: opts.userId, itemId: opts.itemId },
    },
  });

  const attempt1Score =
    opts.attemptSlot === 1
      ? opts.score
      : (existing?.attempt1Score ?? 0);
  const attempt2Score =
    opts.attemptSlot === 2
      ? opts.score
      : (existing?.attempt2Score ?? 0);

  return prisma.speakProgress.upsert({
    where: {
      userId_itemId: { userId: opts.userId, itemId: opts.itemId },
    },
    create: {
      userId: opts.userId,
      itemId: opts.itemId,
      attempt1Score,
      attempt2Score,
      mastered: opts.mastered,
      lastTranscript: opts.transcript,
    },
    update: {
      attempt1Score,
      attempt2Score,
      mastered: opts.mastered,
      lastTranscript: opts.transcript,
    },
  });
}

export async function completeSpeakSession(
  userId: string,
  persona: PersonaId,
  opts: { mastered: boolean },
) {
  const today = jakartaDateKey();
  const stats = await getOrCreateSpeakStats(userId, persona);
  const lastKey = stats.lastPlayDate
    ? jakartaDateKey(stats.lastPlayDate)
    : null;

  let streak = stats.streak;
  if (lastKey === today) {
    // keep
  } else if (lastKey === yesterdayJakartaKey(today)) {
    streak = stats.streak + 1;
  } else {
    streak = 1;
  }

  const xpGain = SPEAK_XP_COMPLETE + (opts.mastered ? SPEAK_XP_MASTERED : 0);
  const bestStreak = Math.max(stats.bestStreak, streak);

  const updated = await prisma.speakStats.update({
    where: { userId_persona: { userId, persona } },
    data: {
      xp: stats.xp + xpGain,
      streak,
      bestStreak,
      sessionsDone: stats.sessionsDone + 1,
      lastPlayDate: new Date(),
    },
  });

  return { xpGained: xpGain, ...updated };
}
