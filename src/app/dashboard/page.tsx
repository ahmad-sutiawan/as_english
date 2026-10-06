import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getModules } from "@/lib/content";
import { getLearningStats } from "@/lib/review";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const modules = getModules();
  const [progressRows, stats] = await Promise.all([
    prisma.progress.findMany({
      where: { userId: session.user.id },
    }),
    getLearningStats(session.user.id),
  ]);
  const progressByModule = new Map(
    progressRows.map((p) => [p.moduleId, p]),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight text-[var(--ink)]">
        Dashboard latihan
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Halo, {session.user.name ?? session.user.email}. Pilih modul — baca
        English, pahami arti Indonesia, lalu ketik ulang jawaban English-nya.
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
          className="shrink-0 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
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

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
        Semua modul
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {modules.map((mod) => {
          const progress = progressByModule.get(mod.id);
          const done = progress?.completedItemIds.length ?? 0;
          const total = mod.itemCount;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <li
              key={mod.id}
              className="border-b border-[var(--border)] pb-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    {mod.status === "ready" ? "Siap dilatih" : "Segera hadir"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">
                    {mod.titleId}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">{mod.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    {mod.description}
                  </p>
                  {mod.status === "ready" && (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Progres: {done}/{total} ({pct}%)
                    </p>
                  )}
                </div>
                {mod.status === "ready" ? (
                  <Link
                    href={`/learn/${mod.id}`}
                    className="shrink-0 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
                  >
                    {done > 0 ? "Lanjut" : "Mulai"}
                  </Link>
                ) : (
                  <span className="shrink-0 text-xs text-[var(--muted)]">
                    Draft
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
