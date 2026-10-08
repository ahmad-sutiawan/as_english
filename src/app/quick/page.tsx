import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  QUICK_HEARTS,
  QUICK_SESSION_SIZE,
  QUICK_XP_CORRECT,
  QUICK_XP_PERFECT_BONUS,
  getOrCreateQuickStats,
} from "@/lib/quick";
import { DIFFICULTY_LABEL_ID, type Difficulty } from "@/types/content";
import { LobbyFrame, StatTile, lobbyCard } from "@/components/lobby-frame";

const LEVELS: { value: "all" | Difficulty; label: string; detail: string }[] = [
  {
    value: "all",
    label: "Semua level",
    detail: "Campuran dari seluruh bank soal kerja.",
  },
  {
    value: "junior",
    label: DIFFICULTY_LABEL_ID.junior,
    detail: "Kalimat pendek untuk mengunci pola dasar.",
  },
  {
    value: "mid",
    label: DIFFICULTY_LABEL_ID.mid,
    detail: "Update, risiko, dan permintaan yang lebih panjang.",
  },
  {
    value: "senior",
    label: DIFFICULTY_LABEL_ID.senior,
    detail: "Tradeoff dan bahasa keputusan yang lebih padat.",
  },
];

export default async function QuickLobbyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stats = await getOrCreateQuickStats(session.user.id);

  return (
    <LobbyFrame
      kicker="Akurasi"
      title="Latihan cepat"
      lede={`${QUICK_SESSION_SIZE} soal, ${QUICK_HEARTS} nyawa, jawaban dipilih dengan ketukan. Konten tetap workplace English, dengan alur yang berbeda dari modul ketik.`}
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile label="XP" value={String(stats.xp)} hint="Jalur Cepat" />
        <StatTile label="Streak" value={String(stats.streak)} hint="Hari ini, WIB" />
        <StatTile label="Rekor" value={String(stats.bestStreak)} hint="Streak terbaik" />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Pilih level lalu mulai</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {LEVELS.map((lv) => (
            <li key={lv.value}>
              <Link
                href={`/quick/play?level=${lv.value}`}
                className={`${lobbyCard} h-full sm:flex-row sm:items-center sm:justify-between`}
              >
                <span>
                  <span className="block font-display text-2xl text-[var(--ink)]">{lv.label}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-[var(--muted)]">
                    {lv.detail}
                  </span>
                </span>
                <span className="mt-4 inline-flex h-10 shrink-0 items-center rounded-full border border-[var(--border)] px-4 text-sm text-[var(--ink)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] sm:mt-0">
                  Mulai
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm text-[var(--muted)]">
        +{QUICK_XP_CORRECT} XP per benar, +{QUICK_XP_PERFECT_BONUS} bonus jika selesai tanpa
        kehilangan nyawa. Streak dihitung per hari (WIB).
      </p>
    </LobbyFrame>
  );
}
