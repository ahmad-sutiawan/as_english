import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BuildThemeList } from "@/components/build-theme-list";
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
import { LobbyFrame, StatTile } from "@/components/lobby-frame";

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
        <BuildThemeList
          locked={locked}
          featured={{
            id: featured.id,
            titleId: featured.titleId,
            description: featured.description,
            count: counts[featured.id] ?? 0,
          }}
          themes={themes.map((theme) => ({
            id: theme.id,
            titleId: theme.titleId,
            description: theme.description,
            count: counts[theme.id] ?? 0,
          }))}
        />
      </section>

      <p className="mt-8 text-sm text-[var(--muted)]">
        Sesi memakai sampai {BUILD_SESSION_SIZE} kalimat dari tema itu. +{BUILD_XP_DRILL} XP
        per kalimat selesai, +{BUILD_XP_PERFECT_BONUS} jika seluruh sesi benar pada percobaan
        pertama.
      </p>
    </LobbyFrame>
  );
}
