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
        Workplace English for IT managers, SREs, and fullstack engineers.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)]">
        Interview to incident bridge to manager updates. Multiple-choice
        scenarios — but you must retype the answer to build writing muscle.
        Play audio with your browser&apos;s Google English voice.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={session ? "/dashboard" : "/register"}
          className="rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          {session ? "Open dashboard" : "Start practicing"}
        </Link>
        {!session && (
          <Link
            href="/login"
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-2)]"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  );
}
