import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getReviewQueue } from "@/lib/review";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const queue = await getReviewQueue(session.user.id, 30);
  const first = queue[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Dashboard
      </Link>

      <h1 className="mt-4 font-display text-3xl tracking-tight text-[var(--ink)]">
        Review pintar
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Antrian berbasis kesalahan terbaru + spaced repetition. Ulangi soal
        yang masih lemah supaya frasa kerja menempel.
      </p>

      {first ? (
        <div className="mt-6">
          <Link
            href={first.href}
            className="inline-flex rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
          >
            Mulai review sekarang
          </Link>
        </div>
      ) : null}

      {queue.length === 0 ? (
        <p className="mt-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--muted)]">
          Belum ada item due. Kerjakan beberapa soal dulu — kalau ada yang
          salah atau sudah waktunya diulang, muncul di sini.
        </p>
      ) : (
        <ol className="mt-8 space-y-3">
          {queue.map((item, idx) => (
            <li key={`${item.moduleId}-${item.itemId}`}>
              <Link
                href={item.href}
                className="block rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--accent)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--muted)]">
                      {String(idx + 1).padStart(2, "0")} · {item.moduleTitleId}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                      {item.prompt}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {item.promptId}
                    </p>
                    <p className="mt-2 text-xs text-[var(--accent)]">
                      {item.reasonId}
                      {item.wrongCount > 0
                        ? ` · salah ${item.wrongCount}x`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted)]">
                    Latih →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
