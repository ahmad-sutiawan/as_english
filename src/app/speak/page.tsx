import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateSpeakStats } from "@/lib/speak";
import { getSpeakManifest } from "@/lib/speak-content";
import { DIFFICULTY_LABEL_ID, type Difficulty } from "@/types/content";

const LEVELS: { value: "all" | Difficulty; label: string }[] = [
  { value: "all", label: "Semua level" },
  { value: "junior", label: DIFFICULTY_LABEL_ID.junior },
  { value: "mid", label: DIFFICULTY_LABEL_ID.mid },
  { value: "senior", label: DIFFICULTY_LABEL_ID.senior },
];

export default async function SpeakLobbyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [stats, manifest] = await Promise.all([
    getOrCreateSpeakStats(session.user.id),
    Promise.resolve(getSpeakManifest()),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Dashboard
      </Link>

      <h1 className="mt-4 font-display text-3xl tracking-tight text-[var(--ink)]">
        Produksi Bicara
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Offline full: Listen → Retrieve → Construct → Speak → Correct → Say
        again. Bukan Duolingo — melatih English keluar otomatis dari passive
        knowledge Anda. Tanpa API AI eksternal.
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            XP Speak
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
            Sesi selesai
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
            {stats.sessionsDone}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          Pack lokal ({manifest.itemCount} kalimat)
        </h2>
        <ul className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
          {manifest.packs.map((p) => (
            <li
              key={p.id}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1"
            >
              {p.titleId} ({p.itemCount})
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Mulai sesi</h2>
        <ul className="space-y-2">
          {LEVELS.map((lv) => (
            <li key={lv.value}>
              <Link
                href={`/speak/play?level=${lv.value}`}
                className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm hover:border-[var(--accent)]"
              >
                <span className="text-[var(--ink)]">{lv.label}</span>
                <span className="font-medium text-[var(--accent)]">Mulai →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
