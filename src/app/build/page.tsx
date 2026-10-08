import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBuildDrills, getOrCreateBuildStats } from "@/lib/build";

export default async function BuildLobbyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stats = await getOrCreateBuildStats(session.user.id);
  const count = getBuildDrills().length;

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
        Dari arti ke urutan kata, lalu ubah bentuknya: negatif, pertanyaan, past,
        atau future. Salah satu chip tidak cukup disebut salah — sistem
        menunjukkan subjek, verb, tempat, dan waktu.
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
          <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">{count}</p>
        </div>
      </section>

      <Link
        href="/build/play"
        className="mt-8 inline-flex rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
      >
        Mulai sesi 8 kalimat
      </Link>

      <p className="mt-8 text-xs text-[var(--muted)]">
        +10 XP per kalimat selesai, +20 jika seluruh sesi benar pada percobaan
        pertama. Streak dihitung per hari (WIB).
      </p>
    </div>
  );
}
