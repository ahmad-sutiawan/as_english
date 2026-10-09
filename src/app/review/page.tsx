import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getReviewQueue } from "@/lib/review";
import { getActivePersona } from "@/lib/persona";
import { LobbyFrame, lobbyCard } from "@/components/lobby-frame";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const persona = await getActivePersona(session.user.id);
  if (!persona) redirect("/dashboard");

  const queue = await getReviewQueue(session.user.id, 30, persona);
  const first = queue[0];
  const dueRatio = Math.min(100, queue.length * 4);

  return (
    <LobbyFrame
      kicker="Ingatan"
      title="Review pintar"
      lede="Antrian dari kesalahan terbaru dan jadwal pengulangan. Ulangi soal yang masih lemah supaya frasa kerja menempel."
    >
      <section className="grid items-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-5 sm:grid-cols-[auto_1fr_auto]">
        <div
          className="grid h-24 w-24 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--accent) ${dueRatio * 3.6}deg, var(--surface-2) 0)`,
          }}
          role="img"
          aria-label={`${queue.length} soal dalam antrian`}
        >
          <div className="grid h-[4.4rem] w-[4.4rem] place-items-center rounded-full bg-[var(--background)]">
            <span className="font-display text-2xl text-[var(--ink)]">{queue.length}</span>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Antrian</p>
          <p className="mt-1 text-lg text-[var(--ink)]">
            {queue.length === 0
              ? "Kosong. Kerjakan modul supaya jadwal terisi."
              : `${queue.length} soal menunggu pengulangan.`}
          </p>
        </div>
        {first ? (
          <Link
            href={first.href}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Mulai review sekarang
          </Link>
        ) : null}
      </section>

      {queue.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 px-5 py-8 text-sm leading-relaxed text-[var(--muted)]">
          Belum ada item due. Kerjakan beberapa soal dulu. Soal yang salah atau sudah
          waktunya diulang akan muncul di sini.
        </p>
      ) : (
        <ol className="mt-6 grid gap-3">
          {queue.map((item, idx) => (
            <li key={`${item.moduleId}-${item.itemId}`}>
              <Link href={item.href} className={lobbyCard}>
                <span className="flex items-start justify-between gap-4">
                  <span className="min-w-0">
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                      {String(idx + 1).padStart(2, "0")} · {item.moduleTitleId}
                    </span>
                    <span className="mt-2 block text-base text-[var(--ink)]">{item.prompt}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">{item.promptId}</span>
                    <span className="mt-3 block text-xs text-[var(--accent)]">
                      {item.reasonId}
                      {item.wrongCount > 0 ? ` · salah ${item.wrongCount}x` : ""}
                    </span>
                  </span>
                  <span className="inline-flex h-10 shrink-0 items-center rounded-full border border-[var(--border)] px-4 text-sm text-[var(--ink)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                    Latih
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </LobbyFrame>
  );
}
