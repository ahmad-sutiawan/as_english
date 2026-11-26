import { GovQuizRunner } from "@/components/governance/quiz-runner";
import { LobbyFrame } from "@/components/lobby-frame";
import { prisma } from "@/lib/db";
import { getGovExam } from "@/lib/governance/catalog";
import { requireItGovernanceLearner } from "@/lib/governance/guard";
import { toPublicGovExercise } from "@/lib/governance/score";

export const dynamic = "force-dynamic";

export default async function GovernanceExamPage() {
  const userId = await requireItGovernanceLearner();
  const exam = getGovExam();
  const history = await prisma.grammarAssessmentAttempt.findMany({
    where: { userId, assessmentId: exam.id },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  return (
    <LobbyFrame
      kicker="Evaluasi Akhir · IT Governance SMB"
      title={exam.title}
      lede={exam.description}
      backHref="/governance"
      backLabel="← IT Governance"
    >
      {history.length > 0 ? (
        <section className="mb-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-4">
          <h2 className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Riwayat ujian</h2>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {history.map((item) => (
              <li key={item.id} className="text-[var(--ink)]">
                {item.score}% · {item.status === "passed" ? "Lulus" : "Belum lulus"}
                {item.submittedAt ? (
                  <span className="text-[var(--muted)]">
                    {" "}
                    · {item.submittedAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <GovQuizRunner
        title="Ujian Skenario IT Governance"
        subtitle={`Jawab seluruh ${exam.questions.length} soal skenario. Ambang kelulusan ${exam.passingScore}%.`}
        exercises={exam.questions.map(toPublicGovExercise)}
        endpoint="/api/governance/exam"
        submitLabel="Kirim ujian akhir"
      />
    </LobbyFrame>
  );
}
