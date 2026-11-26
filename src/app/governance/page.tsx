import Link from "next/link";
import { LobbyFrame, StatTile, lobbyCard } from "@/components/lobby-frame";
import { getGovModules } from "@/lib/governance/catalog";
import { requireItGovernanceLearner } from "@/lib/governance/guard";
import { loadGovDashboard } from "@/lib/governance/store";
import { statusLabel } from "@/lib/mastery/labels";

export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const userId = await requireItGovernanceLearner();
  const data = await loadGovDashboard(userId);
  const modules = getGovModules();
  const totalMinutes = modules.reduce((sum, mod) => sum + mod.estimatedMinutes, 0);

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
            Ujian Akhir (12 soal)
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-3xl text-[var(--ink)]">
          Kurikulum {modules.length} Modul (SMB → Unicorn Track)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Setiap modul dilengkapi konsep inti, tabel referensi framework, studi kasus SMB, checklist aksi, jebakan umum, kalimat eksekutif bahasa Inggris, latihan soal, dan mastery check.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {modules.map((mod) => {
            const prog = data.progressById[mod.id];
            return (
              <Link key={mod.id} href={`/governance/${mod.slug}`} className={lobbyCard}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                    Modul {mod.order} · {mod.frameworkTag}
                  </span>
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--muted)]">
                    {statusLabel(prog?.status)}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-2xl text-[var(--ink)] group-hover:text-[var(--accent)]">
                  {mod.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                  {mod.subtitle}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                  <span>
                    {mod.level} · {mod.estimatedMinutes} menit · {mod.practice.length + mod.mastery.length} soal
                  </span>
                  {prog?.bestScore ? (
                    <span className="font-medium text-[var(--ink)]">Skor terbaik {prog.bestScore}%</span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Evaluasi Akhir</p>
            <h2 className="mt-1 font-display text-2xl text-[var(--ink)]">
              Ujian Akhir IT Governance SMB
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              12 soal studi kasus nyata lintas COBIT 2019, ISO 27001:2022, NIST CSF 2.0, ITIL 4, DRP/UU PDP, dan KPI/KRI. Kelulusan 80%.
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
