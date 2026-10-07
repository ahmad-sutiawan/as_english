import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateQuickStats } from "@/lib/quick";
import { DIFFICULTY_LABEL_ID, type Difficulty } from "@/types/content";

const LEVELS: { value: "all" | Difficulty; label: string }[] = [
  { value: "all", label: "Semua level" },
  { value: "junior", label: DIFFICULTY_LABEL_ID.junior },
  { value: "mid", label: DIFFICULTY_LABEL_ID.mid },
  { value: "senior", label: DIFFICULTY_LABEL_ID.senior },
];

export default async function QuickLobbyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stats = await getOrCreateQuickStats(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Dashboard
      </Link>

      <h1 className="mt-4 font-display text-3xl tracking-tight text-[var(--ink)]">
        Latihan Cepat
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Mode ala Duolingo: 8 soal, 3 nyawa, tap jawaban. Konten tetap workplace
        English — beda alur dari mode ketik-ulang di modul.
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            XP
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
            {stats.xp}
          </p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Streak
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--accent)]">
            {stats.streak} hari
          </p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Best streak
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
            {stats.bestStreak}
          </p>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          Pilih level lalu mulai
        </h2>
        <ul className="space-y-2">
          {LEVELS.map((lv) => (
            <li key={lv.value}>
              <Link
                href={`/quick/play?level=${lv.value}`}
                className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm hover:border-[var(--accent)]"
              >
                <span className="text-[var(--ink)]">{lv.label}</span>
                <span className="font-medium text-[var(--accent)]">Mulai →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-xs text-[var(--muted)]">
        Tip: +10 XP per benar, +20 bonus jika clear tanpa kehilangan nyawa.
        Streak dihitung per hari (WIB).
      </p>
    </div>
  );
}
