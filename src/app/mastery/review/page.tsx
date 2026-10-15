import Link from "next/link";
import { LobbyFrame } from "@/components/lobby-frame";
import { requireLearnerId } from "@/lib/mastery/guard";
import { loadDashboard } from "@/lib/mastery/store";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const userId = await requireLearnerId();
  const data = await loadDashboard(userId);

  return (
    <LobbyFrame
      kicker="Review"
      title="Materi yang jatuh tempo"
      lede="Jarak ulang dimulai dari 1, 3, 7, 14, lalu 30 hari. Nilai mastery di bawah 80% menarik jadwal kembali ke 1 hari."
    >
      {data.due.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Belum ada lesson yang jatuh tempo. Selesaikan mastery check agar lesson masuk antrean.
        </p>
      ) : (
        <ul className="grid gap-3">
          {data.due.map(({ lesson, nextReviewAt }) => (
            <li key={lesson.id} className="rounded-2xl border border-[var(--border)] px-4 py-4">
              <h2 className="text-lg text-[var(--ink)]">{lesson.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Jatuh tempo {nextReviewAt ? nextReviewAt.toLocaleString("id-ID", { dateStyle: "medium" }) : ""}
              </p>
              <Link href={`/mastery/lesson/${lesson.slug}`} className="mt-3 inline-block text-sm underline">
                Ulangi mastery check
              </Link>
            </li>
          ))}
        </ul>
      )}
    </LobbyFrame>
  );
}
