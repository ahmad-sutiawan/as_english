import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBuildThemes, isBuildTheme } from "@/lib/build";
import { getActivePersona } from "@/lib/persona";
import { BuildSession } from "@/components/build-session";

type Props = {
  searchParams: Promise<{ theme?: string }>;
};

export default async function BuildPlayPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const persona = await getActivePersona(session.user.id);
  if (!persona) redirect("/dashboard");

  const { theme: themeRaw } = await searchParams;
  const theme = themeRaw && isBuildTheme(themeRaw, persona) ? themeRaw : "all";
  if (themeRaw && !isBuildTheme(themeRaw, persona)) redirect("/build");
  const meta = getBuildThemes(persona).find((item) => item.id === theme);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/build"
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Lobby Susun
      </Link>
      <h1 className="mt-4 font-display text-2xl tracking-tight text-[var(--ink)]">
        {meta?.titleId ?? "Sesi susun"}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {meta?.description ?? "Susun dulu, lalu ubah bentuk kalimat yang sama."}
      </p>
      <div className="mt-8">
        <BuildSession theme={theme} />
      </div>
    </div>
  );
}
