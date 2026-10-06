import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getItem, getModule, getNextItemId } from "@/lib/content";
import { ExercisePanel } from "@/components/exercise-panel";

type Props = {
  params: Promise<{ moduleId: string; itemId: string }>;
};

export default async function ExercisePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { moduleId, itemId } = await params;
  const mod = getModule(moduleId);
  const item = getItem(moduleId, itemId);
  if (!mod || !item) notFound();

  const nextItemId = getNextItemId(moduleId, itemId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/learn/${moduleId}`}
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← {mod.titleId}
      </Link>
      <div className="mt-6">
        <ExercisePanel
          item={item}
          moduleTitle={mod.title}
          moduleTitleId={mod.titleId}
          nextItemId={nextItemId}
        />
      </div>
    </div>
  );
}
