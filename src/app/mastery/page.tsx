import Link from "next/link";
import { LobbyFrame, StatTile, lobbyCard } from "@/components/lobby-frame";
import { getModules, getPhases, getPublishedLessons } from "@/lib/mastery/catalog";
import { requireLearnerId } from "@/lib/mastery/guard";
import { statusLabel } from "@/lib/mastery/labels";
import { examUnlocked, loadDashboard, moduleProgress } from "@/lib/mastery/store";
import { foundationExam, finalExam } from "@/lib/mastery/content/exams";

export const dynamic = "force-dynamic";

export default async function MasteryDashboardPage() {
  const userId = await requireLearnerId();
  const data = await loadDashboard(userId);
  const phases = getPhases();
  const modules = getModules();
  const published = getPublishedLessons();
  const rowSnap = data.rows.map((row) => ({ lessonId: row.lessonId, status: row.status }));
  const foundation = examUnlocked(foundationExam, rowSnap);
  const finalGate = examUnlocked(finalExam, rowSnap);
  const started = data.rows.length > 0;

  return (
    <LobbyFrame
      kicker="Kurikulum"
      title="Grammar Mastery"
      lede="Learn grammar. Build sentences. Speak with confidence. Penjelasan dalam bahasa Indonesia, latihan dalam bahasa Inggris."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Progres" value={`${data.percent}%`} hint={`${data.completed} dari ${data.publishedCount} lesson terbit`} />
        <StatTile label="Dikuasai" value={String(data.mastered)} hint="Nilai mastery minimal 80%" />
        <StatTile label="Perlu diulang" value={String(data.needsReview)} hint="Riwayat penguasaan tetap tersimpan" />
        <StatTile label="Fase" value={data.phaseTitle} hint="Langkah yang disarankan sekarang" />
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-5">
        <h2 className="font-display text-2xl text-[var(--ink)]">Lanjutkan belajar</h2>
        {data.next ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {started
                ? `${data.next.title}. ${data.due.length > 0 ? "Ada materi yang jatuh tempo untuk diulang." : "Ini lesson berikutnya yang masih relevan."}`
                : "Belum ada progres. Mulai dari lesson pertama."}
            </p>
            <Link
              href={`/mastery/lesson/${data.next.slug}`}
              className="mt-4 inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm text-white"
            >
              Continue Learning
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">Belum ada lesson yang dipublikasikan.</p>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/mastery/roadmap" className="underline text-[var(--accent)]">
          Roadmap
        </Link>
        <Link href="/mastery/review" className="underline text-[var(--accent)]">
          Review ({data.due.length})
        </Link>
        <Link href="/mastery/exam/foundation" className="underline text-[var(--accent)]">
          Ujian fondasi{foundation.open ? "" : " (terkunci)"}
        </Link>
        <Link href="/mastery/exam/final" className="underline text-[var(--accent)]">
          Ujian akhir{finalGate.open ? "" : " (terkunci)"}
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-[var(--ink)]">Fase belajar</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {phases.map((phase) => {
            const phaseModules = modules.filter((item) => item.phaseId === phase.id);
            const publishedInPhase = published.filter((lesson) =>
              phaseModules.some((item) => item.id === lesson.moduleId),
            );
            return (
              <article key={phase.id} className={lobbyCard}>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">{phase.weeks}</p>
                <h3 className="mt-2 font-display text-2xl text-[var(--ink)]">{phase.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{phase.description}</p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {phase.id === "integration"
                    ? "Evaluasi memakai materi yang sudah terbit."
                    : `${phaseModules.length} modul · ${publishedInPhase.length} lesson terbit`}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-[var(--ink)]">Aktivitas terakhir</h2>
        {data.latest?.lesson ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {data.latest.lesson.title} · {statusLabel(data.latest.status)} ·{" "}
            {data.latest.at.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Belum ada aktivitas. Buka Continue Learning untuk memulai lesson pertama.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-[var(--ink)]">Nilai ujian</h2>
        {data.assessments.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Belum ada ujian yang dikirim.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {data.assessments.map((item) => (
              <li key={item.id} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
                {item.assessmentId === "foundation" ? "Ujian fondasi" : "Ujian akhir"} · {item.score}% ·{" "}
                {item.status === "passed" ? "Lulus" : "Belum lulus"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 overflow-x-auto">
        <h2 className="font-display text-2xl text-[var(--ink)]">Modul</h2>
        <table className="mt-3 w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="text-[var(--muted)]">
              <th className="py-2 pr-3 font-medium">Modul</th>
              <th className="py-2 pr-3 font-medium">Lesson terbit</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((item) => {
              const progress = moduleProgress(item.id, rowSnap);
              return (
                <tr key={item.id} className="border-t border-[var(--border)]">
                  <td className="py-3 pr-3">
                    <Link href={`/mastery/module/${item.slug}`} className="text-[var(--ink)] underline">
                      {item.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-[var(--muted)]">
                    {progress.done}/{progress.total}
                  </td>
                  <td className="py-3 text-[var(--muted)]">
                    {progress.total === 0 ? "Belum terbit" : progress.done === progress.total ? "Selesai" : "Berjalan"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </LobbyFrame>
  );
}
