import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SpeakSession } from "@/components/speak-session";
import type { Difficulty } from "@/types/content";

type Props = {
  searchParams: Promise<{ level?: string }>;
};

function parseLevel(raw?: string): Difficulty | "all" {
  if (raw === "junior" || raw === "mid" || raw === "senior") return raw;
  return "all";
}

export default async function SpeakPlayPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { level: levelRaw } = await searchParams;
  const level = parseLevel(levelRaw);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/speak"
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Lobby Produksi Bicara
      </Link>
      <h1 className="mt-4 font-display text-2xl tracking-tight text-[var(--ink)]">
        Sesi produksi
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Setiap audio menampilkan kalimat English sebagai panduan pengucapan.
        Susun, lalu ucapkan. Penilaian tetap lokal.
      </p>
      <div className="mt-8">
        <SpeakSession level={level} caPort={process.env.CA_PORT || "8011"} />
      </div>
    </div>
  );
}
