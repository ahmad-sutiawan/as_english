import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { QuickSprint } from "@/components/quick-sprint";
import type { Difficulty } from "@/types/content";

type Props = {
  searchParams: Promise<{ level?: string }>;
};

function parseLevel(raw?: string): Difficulty | "all" {
  if (raw === "junior" || raw === "mid" || raw === "senior") return raw;
  return "all";
}

export default async function QuickPlayPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { level: levelRaw } = await searchParams;
  const level = parseLevel(levelRaw);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/quick"
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Lobby Latihan Cepat
      </Link>
      <h1 className="mt-4 font-display text-2xl tracking-tight text-[var(--ink)]">
        Empat kalimat
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Lihat arti. Ucapkan atau ketik English. Jangan pilih dari daftar.
      </p>
      <div className="mt-8">
        <QuickSprint level={level} />
      </div>
    </div>
  );
}
