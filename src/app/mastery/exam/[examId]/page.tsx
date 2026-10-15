import Link from "next/link";
import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/mastery/exam-runner";
import { LobbyFrame } from "@/components/lobby-frame";
import { getExam, getLesson } from "@/lib/mastery/catalog";
import { requireLearnerId } from "@/lib/mastery/guard";
import { examUnlocked } from "@/lib/mastery/store";
import { toPublicExercise } from "@/lib/mastery/score";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ examId: string }> };

export default async function ExamPage({ params }: Props) {
  const userId = await requireLearnerId();
  const { examId } = await params;
  const exam = getExam(examId);
  if (!exam) notFound();
  const rows = await prisma.grammarLessonProgress.findMany({
    where: { userId },
    select: { lessonId: true, status: true },
  });
  const gate = examUnlocked(exam, rows);
  const history = await prisma.grammarAssessmentAttempt.findMany({
    where: { userId, assessmentId: exam.id },
    orderBy: { submittedAt: "desc" },
    take: 3,
  });

  return (
    <LobbyFrame kicker="Evaluasi" title={exam.title} lede={exam.description}>
      <p className="text-sm text-[var(--muted)]">
        Bobot: konsep 20%, bentuk kalimat 25%, komunikasi 35%, menulis dan sunting 20%. Kelulusan {exam.passingScore}%.
      </p>
      {history.length > 0 ? (
        <ul className="mt-4 grid gap-2 text-sm">
          {history.map((item) => (
            <li key={item.id}>
              {item.score}% · {item.status === "passed" ? "Lulus" : "Belum lulus"}
            </li>
          ))}
        </ul>
      ) : null}
      {gate.open ? (
        <div className="mt-6">
          <ExamRunner examId={exam.id} exercises={exam.questions.map(toPublicExercise)} />
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--ink)]">{gate.reason}</p>
          <Link href="/mastery" className="mt-3 inline-block text-sm underline">
            Kembali ke dashboard
          </Link>
        </div>
      )}
      <p className="mt-6 text-xs text-[var(--muted)]">
        Lesson terkait contoh: {getLesson(exam.questions[0]?.lessonId ?? "")?.title ?? "kurikulum"}.
      </p>
    </LobbyFrame>
  );
}
