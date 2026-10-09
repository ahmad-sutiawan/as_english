import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateSpeakStats } from "@/lib/speak";
import { getSpeakManifest } from "@/lib/speak-content";
import { getActivePersona } from "@/lib/persona";
import { DIFFICULTY_LABEL_ID, type Difficulty } from "@/types/content";
import { SpeakPackList } from "@/components/speak-pack-list";
import { LobbyFrame, StatTile, lobbyCard } from "@/components/lobby-frame";

const PHASES = [
  "Listen",
  "Retrieve",
  "Construct",
  "Speak",
  "Correct",
  "Say again",
];

const LEVELS: { value: "all" | Difficulty; label: string }[] = [
  { value: "all", label: "Semua level" },
  { value: "junior", label: DIFFICULTY_LABEL_ID.junior },
  { value: "mid", label: DIFFICULTY_LABEL_ID.mid },
  { value: "senior", label: DIFFICULTY_LABEL_ID.senior },
];

export default async function SpeakLobbyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const persona = await getActivePersona(session.user.id);
  if (!persona) redirect("/dashboard");

  const [stats, manifest] = await Promise.all([
    getOrCreateSpeakStats(session.user.id, persona),
    Promise.resolve(getSpeakManifest(persona)),
  ]);

  return (
    <LobbyFrame
      kicker="Produksi"
      title="Produksi bicara"
      lede="Enam tahap offline: dengar, ingat, susun, ucapkan, koreksi, lalu ucapkan lagi. English keluar dari pengetahuan yang sudah ada, tanpa API AI."
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile label="XP Speak" value={String(stats.xp)} hint="Jalur Bicara" />
        <StatTile label="Streak" value={String(stats.streak)} hint="Hari beruntun" />
        <StatTile label="Sesi selesai" value={String(stats.sessionsDone)} hint="Item yang ditutup" />
      </section>

      <ol className="mt-8 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {PHASES.map((phase, index) => (
          <li
            key={phase}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-3"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-1 text-sm text-[var(--ink)]">{phase}</p>
          </li>
        ))}
      </ol>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          Pack lokal · {manifest.itemCount} kalimat
        </h2>
        <SpeakPackList packs={manifest.packs} />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Mulai sesi</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {LEVELS.map((lv) => (
            <li key={lv.value}>
              <Link
                href={`/speak/play?level=${lv.value}`}
                className={`${lobbyCard} h-full flex-row items-center justify-between`}
              >
                <span className="font-display text-2xl text-[var(--ink)]">{lv.label}</span>
                <span className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-sm text-[var(--ink)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                  Mulai
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </LobbyFrame>
  );
}
