import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getModule } from "@/lib/content";

type Props = {
  params: Promise<{ moduleId: string }>;
};

const DIFFICULTY_ID: Record<string, string> = {
  junior: "pemula",
  mid: "menengah",
  senior: "senior",
};

export default async function ModulePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { moduleId } = await params;
  const mod = getModule(moduleId);
  if (!mod) notFound();

  const progress = await prisma.progress.findUnique({
    where: {
      userId_moduleId: {
        userId: session.user.id,
        moduleId,
      },
    },
  });
  const completed = new Set(progress?.completedItemIds ?? []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-4 font-display text-3xl tracking-tight text-[var(--ink)]">
        {mod.titleId}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">{mod.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        {mod.description}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
        Tip: soal ditampilkan dalam English. Di bawahnya ada arti tetap dalam
        Bahasa Indonesia. Jawaban yang diketik harus English.
      </p>

      {mod.status === "stub" || mod.items.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">
          Modul ini masih draft. Konten akan ditambahkan.
        </p>
      ) : (
        <ol className="mt-8 space-y-3">
          {mod.items.map((item, idx) => {
            const done = completed.has(item.id);
            return (
              <li key={item.id}>
                <Link
                  href={`/learn/${moduleId}/${item.id}`}
                  className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-3 text-sm hover:bg-[var(--surface)]/60"
                >
                  <span className="min-w-0">
                    <span className="text-[var(--ink)]">
                      <span className="mr-2 text-[var(--muted)]">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {item.prompt.slice(0, 72)}
                      {item.prompt.length > 72 ? "…" : ""}
                    </span>
                    <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                      {item.promptId}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs uppercase tracking-wide text-[var(--muted)]">
                    {done
                      ? "Dikuasai"
                      : DIFFICULTY_ID[item.difficulty] ?? item.difficulty}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
