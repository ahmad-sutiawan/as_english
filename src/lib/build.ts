import { readFileSync } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { jakartaDateKey } from "@/lib/quick";
import type { BuildDrill, BuildStep } from "@/types/build";
import type { PersonaId } from "@/lib/persona";

export const BUILD_SESSION_SIZE = 8;
export const BUILD_XP_DRILL = 10;
export const BUILD_XP_PERFECT_BONUS = 20;

export const IT_BUILD_THEMES = [
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
  {
    id: "onboarding",
    titleId: "Onboarding",
    description: "Akses, buddy, minggu pertama, dan shadowing.",
  },
  {
    id: "release",
    titleId: "Rilis",
    description: "Jendela deploy, freeze, rollback, dan changelog.",
  },
  {
    id: "estimation",
    titleId: "Estimasi",
    description: "Poin, buffer, dan memotong scope.",
  },
  {
    id: "customer",
    titleId: "Pelanggan",
    description: "Status, keterlambatan, dan solusi sementara.",
  },
  {
    id: "handover",
    titleId: "Serah terima",
    description: "Cuti, pemilik baru, dan runbook.",
  },
  {
    id: "retro",
    titleId: "Retro",
    description: "Yang lancar, yang macet, dan tindakan tim.",
  },
  {
    id: "pairing",
    titleId: "Pairing",
    description: "Driver, navigator, dan belajar bareng.",
  },
  {
    id: "security",
    titleId: "Keamanan",
    description: "Kunci, phishing, MFA, dan review akses.",
  },
  {
    id: "escalation",
    titleId: "Eskalasi",
    description: "Kapan naik, siapa pemilik, dan urgensi.",
  },
  {
    id: "documentation",
    titleId: "Dokumentasi",
    description: "Runbook, ADR, dan catatan yang ketinggalan.",
  },
] as const;

export const HOME_BUILD_THEMES = [
  {
    id: "all",
    titleId: "Semua tema",
    description: "Acak dari seluruh bank kalimat rumah, dasar sampai percakapan keluarga.",
  },
  {
    id: "dasar",
    titleId: "Dasar",
    description: "Urutan kata untuk kegiatan rumah: masak, bersih-bersih, dan waktu.",
  },
  {
    id: "pagi",
    titleId: "Rencana pagi",
    description: "Jadwal sekolah, sarapan, dan siapa yang mengantar.",
  },
  {
    id: "darurat",
    titleId: "Darurat rumah",
    description: "Bocor, listrik mati, dan kabar yang tenang.",
  },
  {
    id: "kabar",
    titleId: "Kabar keluarga",
    description: "Status, risiko, dan minta keputusan ke pasangan atau orang tua.",
  },
  {
    id: "pesan",
    titleId: "Pesan",
    description: "Chat ke keluarga, tetangga, atau pemilik rumah.",
  },
  {
    id: "rencana",
    titleId: "Rencana",
    description: "Liburan, renovasi, dan menjelaskan langkahnya.",
  },
  {
    id: "umpan-balik",
    titleId: "Umpan balik",
    description: "Masukan sopan soal tugas rumah dan pekerjaan rumah tangga.",
  },
  {
    id: "tetangga",
    titleId: "Tetangga",
    description: "Sekolah, tukang, dan batas yang sopan.",
  },
  {
    id: "obrolan",
    titleId: "Obrolan",
    description: "Pasangan, anak, dan orang tua.",
  },
  {
    id: "belanja",
    titleId: "Belanja",
    description: "Daftar belanja, pasar, dan anggaran harian.",
  },
  {
    id: "perbaikan",
    titleId: "Perbaikan",
    description: "Keran, lampu, dan memanggil tukang.",
  },
  {
    id: "anggaran",
    titleId: "Anggaran",
    description: "Tagihan, tabungan, dan keputusan belanja.",
  },
  {
    id: "cerita",
    titleId: "Cerita",
    description: "Menceritakan kejadian di rumah dengan urutan yang jelas.",
  },
  {
    id: "cara-kerja",
    titleId: "Cara kerja",
    description: "Menjelaskan alat rumah dan langkah memasak.",
  },
  {
    id: "masak",
    titleId: "Masak",
    description: "Menu, bahan, dan giliran dapur.",
  },
  {
    id: "sekolah",
    titleId: "Sekolah",
    description: "PR, antar jemput, dan kabar ke guru.",
  },
  {
    id: "kesehatan",
    titleId: "Kesehatan",
    description: "Demam, obat, dan janji ke klinik.",
  },
  {
    id: "tamu",
    titleId: "Tamu",
    description: "Menjamu, kamar, dan waktu pulang.",
  },
  {
    id: "akhir-pekan",
    titleId: "Akhir pekan",
    description: "Istirahat, jalan-jalan, dan rencana Minggu.",
  },
] as const;

export type BuildTheme = {
  id: string;
  titleId: string;
  description: string;
};

export function getBuildThemes(persona: PersonaId): readonly BuildTheme[] {
  return persona === "home" ? HOME_BUILD_THEMES : IT_BUILD_THEMES;
}

function drillsPath(persona: PersonaId) {
  const base = path.join(process.cwd(), "content");
  return persona === "home"
    ? path.join(base, "home", "build", "drills.json")
    : path.join(base, "build", "drills.json");
}

function readDrills(persona: PersonaId): BuildDrill[] {
  const raw = readFileSync(drillsPath(persona), "utf-8");
  return JSON.parse(raw) as BuildDrill[];
}

export function getBuildDrills(persona: PersonaId): BuildDrill[] {
  return readDrills(persona);
}

export function getBuildDrill(id: string, persona: PersonaId): BuildDrill | null {
  return readDrills(persona).find((d) => d.id === id) ?? null;
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

export function isBuildTheme(theme: string, persona: PersonaId): boolean {
  return getBuildThemes(persona).some((item) => item.id === theme);
}

export function countDrillsByTheme(persona: PersonaId): Record<string, number> {
  const counts: Record<string, number> = { all: 0 };
  for (const drill of getBuildDrills(persona)) {
    counts.all += 1;
    counts[drill.theme] = (counts[drill.theme] ?? 0) + 1;
  }
  return counts;
}

export function buildSession(
  persona: PersonaId,
  theme = "all",
  size = BUILD_SESSION_SIZE,
): BuildDrill[] {
  const drills = getBuildDrills(persona);
  const pool = theme === "all" ? drills : drills.filter((drill) => drill.theme === theme);
  return shuffle(pool).slice(0, size);
}

export async function getOrCreateBuildStats(userId: string, persona: PersonaId) {
  return prisma.buildStats.upsert({
    where: { userId_persona: { userId, persona } },
    create: { userId, persona },
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
  persona: PersonaId,
  opts: { drillsDone: number; perfect: boolean },
): Promise<CompleteBuildResult> {
  const xpGained =
    opts.drillsDone * BUILD_XP_DRILL +
    (opts.perfect ? BUILD_XP_PERFECT_BONUS : 0);

  const today = jakartaDateKey();
  const stats = await getOrCreateBuildStats(userId, persona);
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
    where: { userId_persona: { userId, persona } },
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
