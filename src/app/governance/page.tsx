import Link from "next/link";
import { LobbyFrame, StatTile } from "@/components/lobby-frame";
import {
  GovModuleCatalog,
  type GovCatalogCard,
  type GovSearchParagraph,
} from "@/components/governance/module-catalog";
import { getGovExam, getGovModules } from "@/lib/governance/catalog";
import { requireItGovernanceLearner } from "@/lib/governance/guard";
import { loadGovDashboard } from "@/lib/governance/store";
import { statusLabel } from "@/lib/mastery/labels";
import type { GovModule } from "@/types/governance";

export const dynamic = "force-dynamic";

function buildSearchParagraphs(mod: GovModule): GovSearchParagraph[] {
  const items: GovSearchParagraph[] = [];
  let seq = 0;
  const push = (kind: string, label: string, text: string) => {
    seq += 1;
    items.push({ id: `p${seq}`, kind, label, text });
  };

  push("Ringkasan", mod.title, `${mod.subtitle} ${mod.whySmbMatters}`);

  mod.objectives.forEach((obj, i) => {
    push("Tujuan Belajar", `Tujuan ${i + 1}`, obj);
  });

  for (const concept of mod.concepts) {
    for (const paragraph of concept.paragraphs) {
      push("Konsep", concept.heading, paragraph);
    }
    for (const bullet of concept.bullets ?? []) {
      push("Poin Konsep", concept.heading, bullet);
    }
  }

  if (mod.frameworkTable) {
    for (const row of mod.frameworkTable.rows) {
      push(
        "Tabel Framework",
        `${row.code} · ${row.name}`,
        `${row.smbFocus} — ${row.artifact}`,
      );
    }
  }

  push("Studi Kasus", mod.caseStudy.title, `Profil: ${mod.caseStudy.companyProfile} Masalah: ${mod.caseStudy.problem}`);
  for (const action of mod.caseStudy.governanceAction) {
    push("Studi Kasus · Langkah", mod.caseStudy.title, action);
  }
  push("Studi Kasus · Hasil", mod.caseStudy.title, mod.caseStudy.outcome);

  for (const check of mod.smbChecklist) {
    push("Checklist Aksi", "Checklist Praktis", check);
  }

  for (const pitfall of mod.commonPitfalls) {
    push("Jebakan Umum", "Hindari vs Lebih Baik", `Hindari: ${pitfall.pitfall} Lebih baik: ${pitfall.betterWay}`);
  }

  for (const phrase of mod.executiveEnglish) {
    push("Executive English", phrase.situation, `${phrase.en} (${phrase.id})`);
  }

  for (const q of [...mod.practice, ...mod.mastery]) {
    push(
      "Latihan & Soal",
      q.topic,
      `${q.context ? `${q.context} ` : ""}${q.prompt} — Pembahasan: ${q.explanation}`,
    );
  }

  return items;
}

export default async function GovernancePage() {
  const userId = await requireItGovernanceLearner();
  const data = await loadGovDashboard(userId);
  const modules = getGovModules();
  const exam = getGovExam();
  const totalMinutes = modules.reduce((sum, mod) => sum + mod.estimatedMinutes, 0);

  const catalogCards: GovCatalogCard[] = modules.map((mod) => {
    const prog = data.progressById[mod.id];
    return {
      id: mod.id,
      slug: mod.slug,
      order: mod.order,
      frameworkTag: mod.frameworkTag,
      title: mod.title,
      subtitle: mod.subtitle,
      level: mod.level,
      estimatedMinutes: mod.estimatedMinutes,
      questionCount: mod.practice.length + mod.mastery.length,
      statusText: statusLabel(prog?.status),
      bestScore: prog?.bestScore ?? null,
      paragraphs: buildSearchParagraphs(mod),
    };
  });

  return (
    <LobbyFrame
      kicker="Kursus Kerja IT · SMB hingga Level Unicorn"
      title="IT Governance"
      lede="Kurikulum profesional lengkap dari fondasi SMB hingga skala Unicorn: COBIT 2019, ITIL 4, 5 Domain IT Governance, ISO 27001:2022/NIST CSF 2.0, DRP/UU PDP, Compliance-as-Code, AI Governance (ISO 42001), SOC 2 Type II, TPRM, Zero Trust & simulasi eksekutif."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Progres kursus"
          value={`${data.percent}%`}
          hint={`${data.completed} dari ${data.totalModules} modul selesai`}
        />
        <StatTile
          label="Dikuasai"
          value={String(data.mastered)}
          hint="Skor mastery check ≥ 80%"
        />
        <StatTile
          label="Perlu diulang"
          value={String(data.needsReview)}
          hint="Tinjau lagi modul di bawah 80%"
        />
        <StatTile
          label="Estimasi belajar"
          value={`${totalMinutes} mnt`}
          hint={`${modules.length} modul inti + 1 ujian akhir`}
        />
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Langkah berikutnya</p>
        <h2 className="mt-2 font-display text-2xl text-[var(--ink)]">{data.next.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{data.next.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/governance/${data.next.slug}`}
            className="inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
          >
            {data.completed > 0 ? "Lanjutkan modul" : "Mulai dari COBIT 2019"}
          </Link>
          <Link
            href="/governance/exam"
            className="inline-flex h-11 items-center rounded-full border border-[var(--border)] px-5 text-sm text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Ujian Akhir ({exam.questions.length} soal)
          </Link>
        </div>
      </section>

      <GovModuleCatalog modules={catalogCards} />

      <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Evaluasi Akhir</p>
            <h2 className="mt-1 font-display text-2xl text-[var(--ink)]">
              Ujian Akhir IT Governance ({exam.questions.length} Soal)
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {exam.questions.length} soal komprehensif lintas seluruh {modules.length} modul: COBIT 2019, ISO 27001:2022/NIST CSF 2.0, ITIL 4, 5 Domain IT Governance, DRP/UU PDP, Compliance-as-Code, AI Governance, SOC 2 Type II & TPRM. Kelulusan {exam.passingScore}%.
            </p>
          </div>
          <Link
            href="/governance/exam"
            className="inline-flex h-10 shrink-0 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
          >
            Buka ujian akhir
          </Link>
        </div>

        {data.examAttempts.length > 0 ? (
          <ul className="mt-4 grid gap-2">
            {data.examAttempts.map((attempt) => (
              <li
                key={attempt.id}
                className="rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)]"
              >
                Skor <span className="font-medium text-[var(--ink)]">{attempt.score}%</span> ·{" "}
                {attempt.status === "passed" ? "Lulus" : "Belum lulus"}
                {attempt.submittedAt
                  ? ` · ${attempt.submittedAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`
                  : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </LobbyFrame>
  );
}
