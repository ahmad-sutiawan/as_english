import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getModules } from "@/lib/content";
import { getLearningStats } from "@/lib/review";
import { getOrCreateQuickStats } from "@/lib/quick";
import { ModuleCatalog } from "@/components/module-catalog";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const modules = getModules();
  const [progressRows, stats, quickStats] = await Promise.all([
    prisma.progress.findMany({
      where: { userId: session.user.id },
    }),
    getLearningStats(session.user.id),
    getOrCreateQuickStats(session.user.id),
  ]);

  const progressByModule: Record<string, { done: number }> = {};
  for (const p of progressRows) {
    progressByModule[p.moduleId] = { done: p.completedItemIds.length };
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight text-[var(--ink)]">
        Dashboard latihan
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Halo, {session.user.name ?? session.user.email}. Pilih modul — baca
        English, pahami arti Indonesia, lalu ketik ulang. Coba juga modul{" "}
        <span className="text-[var(--accent)]">Percakapan Berantai</span> +
        speak-back untuk mendekati fluent meeting.
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Dikuasai
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
            {stats.mastered}
          </p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Akurasi
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
            {stats.accuracy}%
          </p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Percobaan
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
            {stats.totalAttempts}
          </p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Due review
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--accent)]">
            {stats.dueCount}
          </p>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3 rounded-md border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            Latihan Cepat
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Alur ala Duolingo: 8 soal, tap jawaban, 3 nyawa. XP{" "}
            <span className="text-[var(--ink)]">{quickStats.xp}</span> · streak{" "}
            <span className="text-[var(--accent)]">{quickStats.streak} hari</span>.
          </p>
        </div>
        <Link
          href="/quick"
          className="shrink-0 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
        >
          Mulai cepat
        </Link>
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            Review pintar
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {stats.dueCount > 0
              ? `${stats.dueCount} soal perlu diulang (salah baru / jadwal spaced repetition).`
              : "Belum ada antrian review. Kerjakan modul dulu."}
          </p>
        </div>
        <Link
          href="/review"
          className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:border-[var(--accent)]"
        >
          Buka review
        </Link>
      </section>

      {stats.weakTags.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            Tag lemah minggu ini
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Fokus latihan di tema dengan miss-rate tertinggi.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {stats.weakTags.map((t) => (
              <li
                key={t.tag}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--ink)]"
              >
                <span className="font-medium text-[var(--accent)]">{t.tag}</span>
                <span className="ml-2 text-[var(--muted)]">
                  miss {Math.round(t.missRate * 100)}% ({t.wrong}/{t.total})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stats.reviewPreview.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            Antrian teratas
          </h2>
          <ul className="mt-3 space-y-2">
            {stats.reviewPreview.map((item) => (
              <li key={`${item.moduleId}-${item.itemId}`}>
                <Link
                  href={item.href}
                  className="block rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent)]"
                >
                  <span className="text-[var(--ink)]">{item.prompt}</span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {item.moduleTitleId} · {item.reasonId}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ModuleCatalog modules={modules} progressByModule={progressByModule} />
    </div>
  );
}
