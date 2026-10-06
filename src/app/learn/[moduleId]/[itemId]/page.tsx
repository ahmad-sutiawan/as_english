import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getItem, getModule, getNextItemIdFiltered } from "@/lib/content";
import { ExercisePanel } from "@/components/exercise-panel";
import type { Difficulty } from "@/types/content";

type Props = {
  params: Promise<{ moduleId: string; itemId: string }>;
  searchParams: Promise<{ from?: string; level?: string }>;
};

function parseLevel(raw?: string): Difficulty | "all" {
  if (raw === "junior" || raw === "mid" || raw === "senior") return raw;
  return "all";
}

export default async function ExercisePage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { moduleId, itemId } = await params;
  const { from, level: levelRaw } = await searchParams;
  const level = parseLevel(levelRaw);
  const mod = getModule(moduleId);
  const item = getItem(moduleId, itemId);
  if (!mod || !item) notFound();

  const nextItemId = getNextItemIdFiltered(moduleId, itemId, level);
  const qs = [from === "review" ? "from=review" : "", level !== "all" ? `level=${level}` : ""]
    .filter(Boolean)
    .join("&");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href={`/learn/${moduleId}${level !== "all" ? `?level=${level}` : ""}`}
          className="text-[var(--muted)] hover:text-[var(--ink)]"
        >
          ← {mod.titleId}
        </Link>
        {from === "review" ? (
          <Link
            href="/review"
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--accent)] hover:bg-[var(--surface-2)]"
          >
            Mode review
          </Link>
        ) : null}
        {level !== "all" ? (
          <span className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)]">
            Filter: {level}
          </span>
        ) : null}
      </div>
      <div className="mt-6">
        <ExercisePanel
          item={item}
          moduleTitle={mod.title}
          moduleTitleId={mod.titleId}
          nextItemId={nextItemId}
          nextHref={
            nextItemId
              ? `/learn/${moduleId}/${nextItemId}${qs ? `?${qs}` : ""}`
              : null
          }
        />
      </div>
    </div>
  );
}
