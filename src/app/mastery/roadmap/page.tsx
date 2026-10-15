import Link from "next/link";
import { LobbyFrame } from "@/components/lobby-frame";
import { getLessons, getModules, getPhases } from "@/lib/mastery/catalog";
import { requireLearnerId } from "@/lib/mastery/guard";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  await requireLearnerId();
  const phases = getPhases();
  const modules = getModules();
  const lessons = getLessons();

  return (
    <LobbyFrame
      kicker="Roadmap"
      title="Enam fase, 29 modul"
      lede="Materi berjalan dari kalimat dasar menuju tulisan profesional. Lesson yang belum terbit tidak bisa dibuka."
    >
      <div className="grid gap-6">
        {phases.map((phase) => (
          <section key={phase.id}>
            <h2 className="font-display text-2xl text-[var(--ink)]">{phase.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {phase.weeks}. {phase.description}
            </p>
            {phase.id === "integration" ? (
              <p className="mt-3 text-sm text-[var(--ink)]">
                Fase ini adalah ujian dan pengulangan, bukan modul teori baru.{" "}
                <Link href="/mastery/exam/final" className="underline">
                  Buka ujian akhir
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {modules
                  .filter((item) => item.phaseId === phase.id)
                  .map((item) => {
                    const lesson = lessons.find((entry) => entry.moduleId === item.id && entry.published);
                    return (
                      <li key={item.id} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-base text-[var(--ink)]">
                            {item.order}. {item.title}
                          </h3>
                          {lesson ? (
                            <Link href={`/mastery/lesson/${lesson.slug}`} className="text-sm text-[var(--accent)] underline">
                              Pelajari
                            </Link>
                          ) : (
                            <span className="text-sm text-[var(--muted)]">Belum terbit</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </LobbyFrame>
  );
}
