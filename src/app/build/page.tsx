import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  BUILD_THEMES,
  countDrillsByTheme,
  getOrCreateBuildStats,
} from "@/lib/build";

export default async function BuildLobbyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stats = await getOrCreateBuildStats(session.user.id);
  const counts = countDrillsByTheme();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Dashboard
      </Link>

      <h1 className="mt-4 font-display text-3xl tracking-tight text-[var(--ink)]">
        Susun Kalimat
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Pilih tema percakapan. Setiap kalimat disusun dari chip, lalu diubah
        menjadi negatif, pertanyaan, past, atau future.
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">XP</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">{stats.xp}</p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Streak</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--accent)]">
            {stats.streak} hari
          </p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Pola</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">{counts.all}</p>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Tema percakapan</h2>
        <ul className="space-y-2">
          {BUILD_THEMES.map((theme) => (
            <li key={theme.id}>
              <Link
                href={`/build/play?theme=${theme.id}`}
                className="flex items-center justify-between gap-4 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--accent)]"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--ink)]">
                    {theme.titleId}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                    {theme.description}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-[var(--accent)]">
                  {counts[theme.id] ?? 0} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-xs text-[var(--muted)]">
        Sesi memakai sampai 8 kalimat dari tema itu. +10 XP per kalimat selesai,
        +20 jika seluruh sesi benar pada percobaan pertama.
      </p>
    </div>
  );
}
