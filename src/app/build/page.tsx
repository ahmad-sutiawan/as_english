import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  BUILD_SESSION_SIZE,
  BUILD_XP_DRILL,
  BUILD_XP_PERFECT_BONUS,
  countDrillsByTheme,
  getBuildThemes,
  getOrCreateBuildStats,
} from "@/lib/build";
import { getActivePersona } from "@/lib/persona";
import { getLearnerState } from "@/lib/memory";
import { LobbyFrame, StatTile, lobbyCard } from "@/components/lobby-frame";

export default async function BuildLobbyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const persona = await getActivePersona(session.user.id);
  if (!persona) redirect("/dashboard");

  const stats = await getOrCreateBuildStats(session.user.id, persona);
  const learner = await getLearnerState(session.user.id, persona);
  const locked = !learner.placementPassed;
  const counts = countDrillsByTheme(persona);
  const [featured, ...themes] = getBuildThemes(persona);

  return (
    <LobbyFrame
      kicker="Konstruksi"
      title="Susun kalimat"
      lede="Pilih tema percakapan. Setiap kalimat disusun dari chip, lalu diubah menjadi negatif, pertanyaan, past, atau future."
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile label="XP" value={String(stats.xp)} hint="Jalur Susun" />
        <StatTile label="Streak" value={String(stats.streak)} hint="Hari beruntun" />
        <StatTile label="Pola" value={String(counts.all)} hint="Seluruh bank" />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Tema percakapan</h2>
        <Link
          href={
            locked && featured.id !== "dasar"
              ? "/placement"
              : `/build/play?theme=${featured.id}`
          }
          className={`${lobbyCard} mt-4 bg-[var(--accent-soft)] sm:flex-row sm:items-center sm:justify-between`}
        >
          <span>
            <span className="block font-display text-3xl text-[var(--ink)]">
              {featured.titleId}
            </span>
            <span className="mt-2 block max-w-xl text-sm leading-relaxed text-[var(--muted)]">
              {featured.description}
            </span>
          </span>
          <span className="mt-4 inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[#06221e] sm:mt-0">
            {counts[featured.id] ?? 0} pola
          </span>
        </Link>
        <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {themes.map((theme) => (
            <li key={theme.id}>
              {locked && theme.id !== "dasar" ? (
                <div className={`${lobbyCard} h-full opacity-60`}>
                  <span className="font-display text-2xl text-[var(--ink)]">{theme.titleId}</span>
                  <span className="mt-2 block text-sm text-[var(--muted)]">
                    Terkunci sampai penempatan dasar lulus.
                  </span>
                </div>
              ) : (
              <Link href={`/build/play?theme=${theme.id}`} className={`${lobbyCard} h-full`}>
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display text-2xl text-[var(--ink)]">{theme.titleId}</span>
                  <span className="text-sm font-medium text-[var(--accent)]">
                    {counts[theme.id] ?? 0}
                  </span>
                </span>
                <span className="mt-2 block flex-1 text-sm leading-relaxed text-[var(--muted)]">
                  {theme.description}
                </span>
              </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm text-[var(--muted)]">
        Sesi memakai sampai {BUILD_SESSION_SIZE} kalimat dari tema itu. +{BUILD_XP_DRILL} XP
        per kalimat selesai, +{BUILD_XP_PERFECT_BONUS} jika seluruh sesi benar pada percobaan
        pertama.
      </p>
    </LobbyFrame>
  );
}
