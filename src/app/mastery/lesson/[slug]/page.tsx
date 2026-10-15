import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseRunner } from "@/components/mastery/exercise-runner";
import { StartLesson } from "@/components/mastery/start-lesson";
import { getLesson, getModule, neighborLessons } from "@/lib/mastery/catalog";
import { requireLearnerId } from "@/lib/mastery/guard";
import { statusLabel } from "@/lib/mastery/labels";
import { publicLessonExercises } from "@/lib/mastery/store";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const groups = [
  ["basic", "Dasar"],
  ["daily", "Sehari-hari"],
  ["office", "Kantor"],
  ["social", "Sosial"],
  ["negative", "Negatif"],
  ["question", "Pertanyaan"],
] as const;

export default async function LessonPage({ params }: Props) {
  const userId = await requireLearnerId();
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson?.published) notFound();
  const grammarModule = getModule(lesson.moduleId);
  const neighbors = neighborLessons(lesson.slug);
  const progress = await prisma.grammarLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  });
  const exercises = publicLessonExercises(lesson);

  return (
    <div className="dash-shell min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <StartLesson lessonId={lesson.id} />
        <nav className="text-sm text-[var(--muted)]" aria-label="Jejak">
          <Link href="/mastery" className="underline">
            Grammar Mastery
          </Link>
          <span> / </span>
          <Link href={`/mastery/module/${grammarModule?.slug ?? ""}`} className="underline">
            {grammarModule?.title}
          </Link>
          <span> / {lesson.title}</span>
        </nav>
        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
            {lesson.level} · {lesson.estimatedMinutes} menit · {statusLabel(progress?.status)}
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-[var(--ink)]">{lesson.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{lesson.practicalBenefit}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Prasyarat: {lesson.prerequisites}</p>
        </header>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-[var(--ink)]">Tujuan belajar</h2>
          <ul className="mt-3 list-disc pl-5 text-sm leading-relaxed text-[var(--muted)]">
            {lesson.objectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-[var(--ink)]">Konsep</h2>
          <div className="mt-3 grid gap-3 text-sm leading-relaxed text-[var(--ink)]">
            {lesson.concept.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <h3 className="mt-4 text-sm font-medium">Kapan struktur ini kurang tepat</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--muted)]">
            {lesson.whenNot.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[var(--muted)]">{lesson.contrast}</p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-[var(--ink)]">Rumus</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="text-[var(--muted)]">
                  <th className="py-2 pr-3 font-medium">Bentuk</th>
                  <th className="py-2 pr-3 font-medium">Pola</th>
                  <th className="py-2 font-medium">Fungsi</th>
                </tr>
              </thead>
              <tbody>
                {lesson.formulas.map((item) => (
                  <tr key={item.label} className="border-t border-[var(--border)]">
                    <td className="py-3 pr-3">{item.label}</td>
                    <td className="py-3 pr-3 font-medium">{item.pattern}</td>
                    <td className="py-3 text-[var(--muted)]">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-[var(--ink)]">Contoh</h2>
          {groups.map(([key, label]) => (
            <details key={key} className="mt-3 rounded-2xl border border-[var(--border)] px-4 py-3" open={key === "basic"}>
              <summary className="cursor-pointer text-sm font-medium text-[var(--ink)]">{label}</summary>
              <ul className="mt-3 grid gap-3">
                {lesson.examples[key].map((example) => (
                  <li key={example.en}>
                    <p className="text-sm text-[var(--ink)]">{example.en}</p>
                    <p className="text-sm text-[var(--muted)]">{example.id}</p>
                    {example.note ? <p className="text-xs text-[var(--muted)]">{example.note}</p> : null}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-[var(--ink)]">Perubahan bentuk</h2>
          <ul className="mt-3 grid gap-3">
            {lesson.transformations.map((item) => (
              <li key={item.label} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{item.label}</p>
                <p className="mt-1 text-sm text-[var(--ink)]">{item.sentence}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-[var(--ink)]">Percakapan</h2>
          <div className="mt-3 grid gap-4">
            {lesson.dialogues.map((dialogue) => (
              <article key={dialogue.situation} className="rounded-2xl border border-[var(--border)] px-4 py-4">
                <p className="text-sm text-[var(--muted)]">{dialogue.situation}</p>
                <ul className="mt-3 grid gap-3">
                  {dialogue.lines.map((line) => (
                    <li key={`${line.speaker}-${line.en}`}>
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {line.speaker}: {line.en}
                      </p>
                      <p className="text-sm text-[var(--muted)]">{line.id}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-[var(--ink)]">{dialogue.grammar}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{dialogue.why}</p>
                <p className="mt-2 text-sm text-[var(--ink)]">Variasi: {dialogue.variation}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-[var(--ink)]">Kesalahan umum</h2>
          <ul className="mt-3 grid gap-3">
            {lesson.mistakes.map((item) => (
              <li key={item.incorrect} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
                <p>
                  <span className="font-medium">Keliru:</span> {item.incorrect}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Benar:</span> {item.correct}
                </p>
                <p className="mt-1 text-[var(--muted)]">{item.explanation}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8">
          <ExerciseRunner
            title="Latihan"
            lessonId={lesson.id}
            exercises={exercises.practice}
            endpoint="/api/mastery/practice"
            submitLabel="Periksa latihan"
          />
        </div>

        <section className="mt-8 rounded-2xl border border-[var(--border)] px-4 py-4">
          <h2 className="font-display text-2xl text-[var(--ink)]">Ringkasan</h2>
          <p className="mt-2 text-sm text-[var(--ink)]">{lesson.summary.concept}</p>
          <p className="mt-2 text-sm font-medium">{lesson.summary.formula}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Contoh kunci: {lesson.summary.keyExample}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--muted)]">
            {lesson.summary.avoid.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="mt-4 text-sm font-medium">Checklist tujuan</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--muted)]">
            {lesson.objectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="mt-8">
          <ExerciseRunner
            title="Mastery check"
            lessonId={lesson.id}
            exercises={exercises.mastery}
            endpoint="/api/mastery/check"
            submitLabel="Kirim mastery check"
          />
          <p className="mt-3 text-sm text-[var(--muted)]">
            Ambang {lesson.masteryThreshold}%. Jawaban benar baru ditampilkan setelah Anda mengirim.
            {progress?.latestScore ? ` Nilai terakhir ${progress.latestScore}%.` : ""}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          {neighbors.previous ? (
            <Link href={`/mastery/lesson/${neighbors.previous.slug}`} className="underline">
              Lesson sebelumnya
            </Link>
          ) : null}
          {neighbors.next ? (
            <Link href={`/mastery/lesson/${neighbors.next.slug}`} className="underline">
              Lesson berikutnya
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
