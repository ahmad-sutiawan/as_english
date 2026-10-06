import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getModules } from "@/lib/content";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const modules = getModules();
  const progressRows = await prisma.progress.findMany({
    where: { userId: session.user.id },
  });
  const progressByModule = new Map(
    progressRows.map((p) => [p.moduleId, p]),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight text-[var(--ink)]">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Welcome back, {session.user.name ?? session.user.email}. Pick a module
        and type your way to workplace fluency.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {modules.map((mod) => {
          const progress = progressByModule.get(mod.id);
          const done = progress?.completedItemIds.length ?? 0;
          const total = mod.itemCount;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <li
              key={mod.id}
              className="border-b border-[var(--border)] pb-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    {mod.status === "ready" ? "Ready" : "Coming soon"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">
                    {mod.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    {mod.description}
                  </p>
                  {mod.status === "ready" && (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Progress: {done}/{total} ({pct}%)
                    </p>
                  )}
                </div>
                {mod.status === "ready" ? (
                  <Link
                    href={`/learn/${mod.id}`}
                    className="shrink-0 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
                  >
                    {done > 0 ? "Continue" : "Start"}
                  </Link>
                ) : (
                  <span className="shrink-0 text-xs text-[var(--muted)]">
                    Stub
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
