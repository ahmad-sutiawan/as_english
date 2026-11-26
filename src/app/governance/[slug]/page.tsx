import Link from "next/link";
import { notFound } from "next/navigation";
import { GovQuizRunner } from "@/components/governance/quiz-runner";
import { StartGovModule } from "@/components/governance/start-module";
import { SpeakButton } from "@/components/speak-button";
import { prisma } from "@/lib/db";
import { getGovModuleBySlug, neighborGovModules } from "@/lib/governance/catalog";
import { requireItGovernanceLearner } from "@/lib/governance/guard";
import { publicGovModuleExercises } from "@/lib/governance/store";
import { statusLabel } from "@/lib/mastery/labels";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function GovernanceModulePage({ params }: Props) {
  const userId = await requireItGovernanceLearner();
  const { slug } = await params;
  const mod = getGovModuleBySlug(slug);
  if (!mod) notFound();

  const neighbors = neighborGovModules(mod.slug);
  const progress = await prisma.grammarLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: mod.id } },
  });
  const exercises = publicGovModuleExercises(mod);

  return (
    <div className="dash-shell min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <StartGovModule moduleId={mod.id} />

        <nav className="text-sm text-[var(--muted)]" aria-label="Jejak">
          <Link href="/governance" className="underline hover:text-[var(--ink)]">
            IT Governance
          </Link>
          <span> / Modul {mod.order}: {mod.frameworkTag}</span>
        </nav>

        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            Modul {mod.order} · {mod.frameworkTag} · {mod.estimatedMinutes} menit ·{" "}
            {statusLabel(progress?.status)}
          </p>
          <h1 className="mt-3 font-display text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
            {mod.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">{mod.subtitle}</p>
        </header>

        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Mengapa materi ini penting di perusahaan skala kecil–menengah (SMB)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">{mod.whySmbMatters}</p>
          <h3 className="mt-5 text-sm font-semibold text-[var(--ink)]">Tujuan pembelajaran</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--muted)]">
            {mod.objectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="mt-8 space-y-6">
          {mod.concepts.map((section) => (
            <section
              key={section.heading}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5"
            >
              <h2 className="font-display text-2xl text-[var(--ink)]">{section.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--ink)]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.bullets ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)]">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {mod.frameworkTable ? (
          <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
            <h2 className="font-display text-2xl text-[var(--ink)]">
              {mod.frameworkTable.title}
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                    {mod.frameworkTable.columns.map((col) => (
                      <th key={col} className="py-2 pr-4 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mod.frameworkTable.rows.map((row) => (
                    <tr key={row.code} className="border-b border-[var(--border)]/70 align-top">
                      <td className="py-3 pr-4 font-mono text-xs font-semibold text-[var(--accent)]">
                        {row.code}
                      </td>
                      <td className="py-3 pr-4 font-medium text-[var(--ink)]">{row.name}</td>
                      <td className="py-3 pr-4 text-[var(--muted)]">{row.smbFocus}</td>
                      <td className="py-3 text-[var(--muted)]">{row.artifact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-3xl border border-[var(--accent)]/40 bg-[var(--accent-soft)]/30 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">Studi Kasus SMB</p>
          <h2 className="mt-1 font-display text-2xl text-[var(--ink)]">{mod.caseStudy.title}</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">{mod.caseStudy.companyProfile}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
            <span className="font-medium">Masalah: </span>
            {mod.caseStudy.problem}
          </p>
          <p className="mt-3 text-sm font-medium text-[var(--ink)]">Langkah tata kelola:</p>
          <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--muted)]">
            {mod.caseStudy.governanceAction.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
            <span className="font-medium text-[var(--accent)]">Hasil: </span>
            {mod.caseStudy.outcome}
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
            <h2 className="font-display text-2xl text-[var(--ink)]">Checklist Aksi SMB</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)]">
              {mod.smbChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
            <h2 className="font-display text-2xl text-[var(--ink)]">Jebakan Umum di SMB</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {mod.commonPitfalls.map((item) => (
                <li key={item.pitfall} className="rounded-2xl border border-[var(--border)] p-3">
                  <p className="text-[var(--danger)]">Hindari: {item.pitfall}</p>
                  <p className="mt-1 text-[var(--ink)]">Lebih baik: {item.betterWay}</p>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
            Executive English · Siap Pakai di Rapat
          </p>
          <h2 className="mt-1 font-display text-2xl text-[var(--ink)]">
            Cara Menjelaskan ke Direksi & Klien dalam Bahasa Inggris
          </h2>
          <ul className="mt-4 space-y-3">
            {mod.executiveEnglish.map((phrase) => (
              <li
                key={phrase.en}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)]/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[var(--accent)]">{phrase.situation}</p>
                  <SpeakButton text={phrase.en} label="Dengar" />
                </div>
                <p className="mt-2 text-sm font-medium text-[var(--ink)]">{phrase.en}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{phrase.id}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8">
          <GovQuizRunner
            title="Latihan Pemahaman"
            subtitle="Uji pemahaman konsep utama sebelum masuk ke Mastery Check."
            moduleId={mod.id}
            exercises={exercises.practice}
            endpoint="/api/governance/practice"
            submitLabel="Periksa latihan"
          />
        </div>

        <div className="mt-8">
          <GovQuizRunner
            title="Mastery Check"
            subtitle={`Ambang penguasaan ${mod.masteryThreshold}%. ${
              progress?.bestScore ? `Skor terbaik Anda: ${progress.bestScore}%.` : ""
            }`}
            moduleId={mod.id}
            exercises={exercises.mastery}
            endpoint="/api/governance/check"
            submitLabel="Kirim mastery check"
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            {neighbors.previous ? (
              <Link
                href={`/governance/${neighbors.previous.slug}`}
                className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-[var(--ink)] hover:border-[var(--accent)]"
              >
                ← Modul {neighbors.previous.order}
              </Link>
            ) : (
              <Link
                href="/governance"
                className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-[var(--ink)] hover:border-[var(--accent)]"
              >
                ← Daftar Modul
              </Link>
            )}
          </div>
          <div>
            {neighbors.next ? (
              <Link
                href={`/governance/${neighbors.next.slug}`}
                className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
              >
                Lanjut Modul {neighbors.next.order} →
              </Link>
            ) : (
              <Link
                href="/governance/exam"
                className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
              >
                Buka Ujian Akhir →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
