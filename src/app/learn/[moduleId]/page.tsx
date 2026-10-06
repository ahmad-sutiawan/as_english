import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getModule } from "@/lib/content";
import { ModuleItemList } from "@/components/module-item-list";
import type { Difficulty } from "@/types/content";
import { DIFFICULTY_LABEL_ID } from "@/types/content";

type Props = {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ level?: string }>;
};

function parseLevel(raw?: string): Difficulty | "all" {
  if (raw === "junior" || raw === "mid" || raw === "senior") return raw;
  return "all";
}

export default async function ModulePage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { moduleId } = await params;
  const { level: levelRaw } = await searchParams;
  const initialLevel = parseLevel(levelRaw);
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

  const items = mod.items.map((item) => ({
    id: item.id,
    difficulty: item.difficulty,
    prompt: item.prompt,
    promptId: item.promptId,
    done: completed.has(item.id),
  }));

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
      {mod.level ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Level dominan:{" "}
          <span className="text-[var(--accent)]">
            {DIFFICULTY_LABEL_ID[mod.level]}
          </span>
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
        Tip: filter level di bawah untuk latihan bertahap (Pemula dulu, lalu
        Menengah/Senior). Soal English + arti Indonesia; jawaban diketik
        English.
      </p>

      {mod.status === "stub" || mod.items.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">
          Modul ini masih draft. Konten akan ditambahkan.
        </p>
      ) : (
        <ModuleItemList
          moduleId={moduleId}
          items={items}
          initialLevel={initialLevel}
        />
      )}
    </div>
  );
}
