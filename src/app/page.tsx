import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="mx-auto flex max-w-5xl flex-col px-4 pb-20 pt-16 sm:pt-24">
      <p className="font-display text-5xl leading-none tracking-tight text-[var(--ink)] sm:text-6xl">
        AS English
      </p>
      <h1 className="mt-6 max-w-2xl text-2xl font-medium leading-snug text-[var(--ink)] sm:text-3xl">
        Stimulator English kerja untuk IT Manager, SRE, dan Fullstack.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)]">
        Panduan &amp; penjelasan dalam Bahasa Indonesia. Soal dan jawaban yang
        diketik tetap English — tiap kalimat punya terjemahan tetap agar kamu
        paham arti, susunan kata, sekaligus melatih menulis.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={session ? "/dashboard" : "/register"}
          className="rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          {session ? "Buka dashboard" : "Mulai latihan"}
        </Link>
        {!session && (
          <Link
            href="/login"
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-2)]"
          >
            Masuk
          </Link>
        )}
      </div>
    </div>
  );
}
