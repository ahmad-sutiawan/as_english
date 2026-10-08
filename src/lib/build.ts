import { readFileSync } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { jakartaDateKey } from "@/lib/quick";
import type { BuildDrill, BuildStep } from "@/types/build";

export const BUILD_SESSION_SIZE = 8;
export const BUILD_XP_DRILL = 10;
export const BUILD_XP_PERFECT_BONUS = 20;

export const BUILD_THEMES = [
  {
    id: "all",
    titleId: "Semua tema",
    description: "Acak dari seluruh bank kalimat, dasar sampai percakapan kerja.",
  },
  {
    id: "dasar",
    titleId: "Dasar",
    description: "Urutan kata, be, tempat, waktu, lalu negatif atau pertanyaan.",
  },
  {
    id: "standup",
    titleId: "Standup",
    description: "Blocker, ETA, dan minta bantuan di sync harian.",
  },
  {
    id: "incident",
    titleId: "Insiden",
    description: "Severity, mitigasi, bridge, dan pemulihan layanan.",
  },
  {
    id: "manager",
    titleId: "Update manager",
    description: "Status, risiko, anggaran, dan minta keputusan.",
  },
  {
    id: "code-review",
    titleId: "Code review",
    description: "Komentar, tes, dan saran di pull request.",
  },
  {
    id: "one-on-one",
    titleId: "1:1",
    description: "Kepemilikan, coaching, dan umpan balik.",
  },
  {
    id: "interview",
    titleId: "Wawancara",
    description: "Jawaban singkat behavioral dan teknis.",
  },
  {
    id: "slack",
    titleId: "Slack dan email",
    description: "Balasan, nada, pemilik tugas, dan menutup thread.",
  },
  {
    id: "presentation",
    titleId: "Presentasi",
    description: "Pembuka, demo, slide, dan sesi tanya jawab.",
  },
  {
    id: "postmortem",
    titleId: "Postmortem",
    description: "Dampak, timeline, akar masalah, dan tindak lanjut.",
  },
  {
    id: "vendor",
    titleId: "Lintas tim",
    description: "Deadline vendor, scope, dan dorongan yang sopan.",
  },
  {
    id: "negotiation",
    titleId: "Negosiasi",
    description: "Tawaran, gaji, tanggal mulai, dan counter-offer.",
  },
  {
    id: "meeting",
    titleId: "Rapat",
    description: "Agenda, keputusan, notulen, dan tindak lanjut.",
  },
  {
    id: "small-talk",
    titleId: "Obrolan ringan",
    description: "Sapaan kantor, makan siang, dan kabar singkat.",
  },
  {
    id: "phone",
    titleId: "Telepon",
    description: "Membuka panggilan, koneksi, dan janji menelepon balik.",
  },
  {
    id: "clarification",
    titleId: "Klarifikasi",
    description: "Meminta ulang, memastikan arti, dan merangkum keputusan.",
  },
  {
    id: "troubleshooting",
    titleId: "Pemecahan masalah",
    description: "Log, error, hotfix, dan dugaan penyebab.",
  },
] as const;

export type BuildThemeId = (typeof BUILD_THEMES)[number]["id"];

const drillsPath = path.join(process.cwd(), "content", "build", "drills.json");

function readDrills(): BuildDrill[] {
  const raw = readFileSync(drillsPath, "utf-8");
  return JSON.parse(raw) as BuildDrill[];
}

export function getBuildDrills(): BuildDrill[] {
  return readDrills();
}

export function getBuildDrill(id: string): BuildDrill | null {
  return readDrills().find((d) => d.id === id) ?? null;
}

export function tokensMatch(given: string[], expected: string[]): boolean {
  if (given.length !== expected.length) return false;
  return given.every((token, index) => token === expected[index]);
}

export function stepFor(drill: BuildDrill, step: "assemble" | "transform"): BuildStep {
  return step === "assemble" ? drill.assemble : drill.transform;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function yesterdayJakartaKey(todayKey: string): string {
  const [y, m, day] = todayKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day, 5, 0, 0));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return jakartaDateKey(dt);
}

export function isBuildTheme(theme: string): theme is BuildThemeId {
  return BUILD_THEMES.some((item) => item.id === theme);
}

export function countDrillsByTheme(): Record<string, number> {
  const counts: Record<string, number> = { all: 0 };
  for (const drill of getBuildDrills()) {
    counts.all += 1;
    counts[drill.theme] = (counts[drill.theme] ?? 0) + 1;
  }
  return counts;
}

export function buildSession(
  theme: BuildThemeId = "all",
  size = BUILD_SESSION_SIZE,
): BuildDrill[] {
  const pool =
    theme === "all"
      ? getBuildDrills()
      : getBuildDrills().filter((drill) => drill.theme === theme);
  return shuffle(pool).slice(0, size);
}

export async function getOrCreateBuildStats(userId: string) {
  return prisma.buildStats.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export type CompleteBuildResult = {
  xpGained: number;
  xpTotal: number;
  streak: number;
  bestStreak: number;
};

export async function completeBuildSession(
  userId: string,
  opts: { drillsDone: number; perfect: boolean },
): Promise<CompleteBuildResult> {
  const xpGained =
    opts.drillsDone * BUILD_XP_DRILL +
    (opts.perfect ? BUILD_XP_PERFECT_BONUS : 0);

  const today = jakartaDateKey();
  const stats = await getOrCreateBuildStats(userId);
  const lastKey = stats.lastPlayDate ? jakartaDateKey(stats.lastPlayDate) : null;

  let streak = stats.streak;
  if (lastKey === today) {
    // already played today
  } else if (lastKey === yesterdayJakartaKey(today)) {
    streak = stats.streak + 1;
  } else {
    streak = 1;
  }

  const bestStreak = Math.max(stats.bestStreak, streak);
  const updated = await prisma.buildStats.update({
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
