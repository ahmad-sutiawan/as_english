import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getModules } from "@/lib/content";
import { getLearningStats } from "@/lib/review";
import { getOrCreateQuickStats } from "@/lib/quick";
import { getOrCreateSpeakStats } from "@/lib/speak";
import { getOrCreateBuildStats } from "@/lib/build";
import { ModuleCatalog } from "@/components/module-catalog";
import { redirect } from "next/navigation";

function jakartaHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );
}

function greeting(hour: number) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function firstName(name: string | null | undefined, email: string | null | undefined) {
  const raw = name?.trim() || email?.split("@")[0] || "learner";
  return raw.split(" ")[0];
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const modules = getModules();
  const [progressRows, stats, quickStats, speakStats, buildStats] = await Promise.all([
    prisma.progress.findMany({
      where: { userId: session.user.id },
    }),
    getLearningStats(session.user.id),
    getOrCreateQuickStats(session.user.id),
    getOrCreateSpeakStats(session.user.id),
    getOrCreateBuildStats(session.user.id),
  ]);

  const progressByModule: Record<string, { done: number }> = {};
  for (const p of progressRows) {
    progressByModule[p.moduleId] = { done: p.completedItemIds.length };
  }

  const totalItems = modules.reduce((sum, module) => sum + module.itemCount, 0);
  const doneItems = Object.values(progressByModule).reduce((sum, row) => sum + row.done, 0);
  const coverage = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const totalXp = buildStats.xp + speakStats.xp + quickStats.xp;
  const activeStreak = Math.max(buildStats.streak, speakStats.streak, quickStats.streak);
  const name = firstName(session.user.name, session.user.email);

  const next =
    stats.dueCount > 0
      ? {
          href: "/review",
          title: "Review pintar",
          detail: `${stats.dueCount} soal sudah jatuh tempo. Ulangi sebelum menambah materi baru.`,
          action: "Buka antrian",
        }
      : buildStats.xp === 0
        ? {
            href: "/build",
            title: "Susun kalimat",
            detail: "Mulai dari urutan kata. Itu jalur paling pendek dari tahu kosakata ke bisa menyusun.",
            action: "Mulai susun",
          }
        : speakStats.xp < buildStats.xp
          ? {
              href: "/speak",
              title: "Produksi bicara",
              detail: "Susunan sudah jalan. Berikutnya ambil kalimat yang sama dan ucapkan.",
              action: "Mulai bicara",
            }
          : {
              href: "/quick",
              title: "Latihan cepat",
              detail: "Jaga akurasi dengan 8 soal tap. Nyawa habis berarti pola itu belum otomatis.",
              action: "Mulai cepat",
            };

  const tracks = [
    {
      href: "/build",
      kicker: "Konstruksi",
      title: "Susun",
      detail: "Urutan kata, lalu ubah jadi negatif, pertanyaan, past, atau future.",
      xp: buildStats.xp,
      streak: buildStats.streak,
      action: "Susun",
    },
    {
      href: "/speak",
      kicker: "Produksi",
      title: "Bicara",
      detail: "Dengar, ingat, susun, lalu ucapkan. Tanpa mengetik jawaban.",
      xp: speakStats.xp,
      streak: speakStats.streak,
      action: "Bicara",
    },
    {
      href: "/quick",
      kicker: "Akurasi",
      title: "Cepat",
      detail: "Delapan soal, tiga nyawa. Latihan mengenali kalimat kerja yang benar.",
      xp: quickStats.xp,
      streak: quickStats.streak,
      action: "Cepat",
    },
    {
      href: "/review",
      kicker: "Ingatan",
      title: "Review",
      detail:
        stats.dueCount > 0
          ? `${stats.dueCount} soal menunggu pengulangan.`
          : "Antrian kosong. Kerjakan modul supaya jadwal pengulangan terisi.",
      xp: stats.mastered,
      streak: stats.dueCount,
      action: "Review",
      xpLabel: "dikuasai",
      streakLabel: "jatuh tempo",
    },
  ];

  const meters = [
    { label: "Cakupan modul", value: coverage, text: `${doneItems}/${totalItems}` },
    { label: "Akurasi", value: stats.accuracy, text: `${stats.correctAttempts}/${stats.totalAttempts}` },
    { label: "Dikuasai", value: totalItems ? Math.min(100, Math.round((stats.mastered / totalItems) * 100)) : 0, text: String(stats.mastered) },
    { label: "Review jatuh tempo", value: Math.min(100, stats.dueCount * 8), text: String(stats.dueCount) },
  ];

  return (
    <div className="dash-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <section className="dash-rise grid items-end gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
              Papan latihan
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-tight text-[var(--ink)] sm:text-5xl">
              {greeting(jakartaHour())}, {name}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)]">
              {totalXp} XP terkumpul dari Susun, Bicara, dan Cepat. Streak aktif{" "}
              {activeStreak} hari. Cakupan modul {coverage}%.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={next.href}
                className="inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
              >
                {next.action}
              </Link>
              <p className="max-w-sm self-center text-sm text-[var(--muted)]">
                <span className="text-[var(--ink)]">{next.title}. </span>
                {next.detail}
              </p>
              <Link
                href="/guide"
                className="inline-flex h-11 items-center text-sm text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Baca panduan
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <div
              className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--accent) ${coverage * 3.6}deg, var(--surface-2) 0)`,
              }}
              role="img"
              aria-label={`Cakupan modul ${coverage} persen`}
            >
              <div className="grid h-[5.25rem] w-[5.25rem] place-items-center rounded-full bg-[var(--background)]">
                <span className="text-2xl font-semibold text-[var(--ink)]">{coverage}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Modul selesai</p>
              <p className="mt-1 text-lg text-[var(--ink)]">
                {doneItems} dari {totalItems} soal
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {stats.totalAttempts} percobaan · akurasi {stats.accuracy}%
              </p>
            </div>
          </div>
        </section>

        <section className="dash-rise dash-rise-2 mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {meters.map((meter) => (
            <article
              key={meter.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{meter.label}</p>
                <p className="text-sm text-[var(--ink)]">{meter.text}</p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${meter.value}%` }}
                />
              </div>
            </article>
          ))}
        </section>

        <section className="dash-rise dash-rise-3 mt-8 grid gap-3 md:grid-cols-2">
          {tracks.map((track) => (
            <article
              key={track.href}
              className="group flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{track.kicker}</p>
              <h2 className="mt-2 font-display text-3xl text-[var(--ink)]">{track.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{track.detail}</p>
              <div className="mt-5 flex items-end justify-between gap-3">
                <p className="text-sm text-[var(--muted)]">
                  <span className="text-lg font-semibold text-[var(--ink)]">{track.xp}</span>{" "}
                  {track.xpLabel ?? "XP"}
                  <span className="mx-2 text-[var(--border)]">/</span>
                  <span className="text-[var(--ink)]">{track.streak}</span>{" "}
                  {track.streakLabel ?? "hari"}
                </p>
                <Link
                  href={track.href}
                  className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-sm text-[var(--ink)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]"
                >
                  {track.action}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-3 lg:grid-cols-2">
          <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Titik lemah</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Tema dengan miss-rate tertinggi minggu ini.
            </p>
            {stats.weakTags.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {stats.weakTags.slice(0, 5).map((tag) => (
                  <li key={tag.tag}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-[var(--ink)]">{tag.tag}</span>
                      <span className="text-[var(--muted)]">
                        {Math.round(tag.missRate * 100)}% · {tag.wrong}/{tag.total}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div
                        className="h-full rounded-full bg-[var(--warn)]"
                        style={{ width: `${Math.round(tag.missRate * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                Belum cukup percobaan. Kerjakan satu modul supaya peta kelemahan muncul.
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Antrian terdekat</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Lima soal yang paling perlu diulang sekarang.
            </p>
            {stats.reviewPreview.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {stats.reviewPreview.map((item) => (
                  <li key={`${item.moduleId}-${item.itemId}`}>
                    <Link
                      href={item.href}
                      className="block rounded-2xl border border-[var(--border)] px-3 py-2.5 transition hover:border-[var(--accent)]"
                    >
                      <span className="block text-sm text-[var(--ink)]">{item.prompt}</span>
                      <span className="mt-1 block text-xs text-[var(--muted)]">
                        {item.moduleTitleId} · {item.reasonId}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                Antrian masih kosong. Selesai satu latihan, lalu kembali ke sini.
              </p>
            )}
          </article>
        </section>

        <div className="mt-10">
          <ModuleCatalog modules={modules} progressByModule={progressByModule} />
        </div>
      </div>
    </div>
  );
}
