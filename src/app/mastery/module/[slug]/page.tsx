import Link from "next/link";
import { notFound } from "next/navigation";
import { LobbyFrame } from "@/components/lobby-frame";
import { getModule, getModules, getPhase, lessonsForModule } from "@/lib/mastery/catalog";
import { requireLearnerId } from "@/lib/mastery/guard";
import { statusLabel } from "@/lib/mastery/labels";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function ModuleDetailPage({ params }: Props) {
  const userId = await requireLearnerId();
  const { slug } = await params;
  const current = getModule(slug);
  if (!current) notFound();
  const phase = getPhase(current.phaseId);
  const lessons = lessonsForModule(current.id);
  const rows = await prisma.grammarLessonProgress.findMany({
    where: { userId, lessonId: { in: lessons.map((lesson) => lesson.id) } },
  });
  const ordered = getModules().filter((item) => item.phaseId === current.phaseId);
  const index = ordered.findIndex((item) => item.id === current.id);
  const previous = ordered[index - 1];
  const next = ordered[index + 1];
  const published = lessons.filter((lesson) => lesson.published);
  const done = published.filter((lesson) => {
    const status = rows.find((row) => row.lessonId === lesson.id)?.status;
    return status === "completed" || status === "mastered" || status === "needs_review";
  }).length;

  return (
    <LobbyFrame
      kicker={phase?.title ?? "Modul"}
      title={current.title}
      lede={current.description}
    >
      <p className="text-sm text-[var(--muted)]">
        Perkiraan {current.estimatedMinutes} menit · {done}/{published.length || 0} lesson terbit selesai
      </p>
      <h2 className="mt-6 text-sm font-medium text-[var(--ink)]">Tujuan belajar</h2>
      <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-[var(--muted)]">
        {current.objectives.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h2 className="mt-6 text-sm font-medium text-[var(--ink)]">Lesson</h2>
      <ul className="mt-2 grid gap-2">
        {lessons.map((lesson) => {
          const status = rows.find((row) => row.lessonId === lesson.id)?.status;
          return (
            <li key={lesson.id} className="rounded-2xl border border-[var(--border)] px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[var(--ink)]">{lesson.title}</h3>
                <span className="text-xs text-[var(--muted)]">
                  {lesson.published ? statusLabel(status) : "Draf"} · {lesson.estimatedMinutes} mnt
                </span>
              </div>
              {lesson.published ? (
                <Link href={`/mastery/lesson/${lesson.slug}`} className="mt-2 inline-block text-sm text-[var(--accent)] underline">
                  Buka lesson
                </Link>
              ) : (
                <p className="mt-2 text-sm text-[var(--muted)]">Lesson ini belum dibuka karena materinya belum lengkap.</p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        {previous ? (
          <Link href={`/mastery/module/${previous.slug}`} className="underline">
            Modul sebelumnya
          </Link>
        ) : null}
        {next ? (
          <Link href={`/mastery/module/${next.slug}`} className="underline">
            Modul berikutnya
          </Link>
        ) : null}
        <Link href="/mastery/roadmap" className="underline">
          Roadmap
        </Link>
      </div>
    </LobbyFrame>
  );
}
