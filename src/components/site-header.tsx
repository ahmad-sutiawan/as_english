import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-[var(--ink)]"
        >
          AS English
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[var(--muted)]">
          {session?.user ? (
            <>
              <Link href="/dashboard" className="hover:text-[var(--ink)]">
                Dashboard
              </Link>
              <Link href="/build" className="hover:text-[var(--ink)]">
                Susun
              </Link>
              <Link href="/quick" className="hover:text-[var(--ink)]">
                Cepat
              </Link>
              <Link href="/speak" className="hover:text-[var(--ink)]">
                Bicara
              </Link>
              <Link href="/review" className="hover:text-[var(--ink)]">
                Review
              </Link>
              <span className="hidden sm:inline">{session.user.email}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[var(--ink)] hover:bg-[var(--surface-2)]"
                >
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-[var(--ink)]">
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
              >
                Daftar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
