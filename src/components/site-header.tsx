import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { SiteNav } from "@/components/site-nav";
import { getActivePersona } from "@/lib/persona";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export async function SiteHeader() {
  const session = await auth();
  const accountLabel = session?.user?.name || session?.user?.email || "";
  const persona = session?.user?.id ? await getActivePersona(session.user.id) : null;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link
          href={session?.user ? "/dashboard" : "/"}
          className="inline-flex items-center gap-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[#06221e]"
          >
            AS
          </span>
          <span className="text-sm font-semibold tracking-tight text-[var(--ink)]">
            AS English
          </span>
        </Link>

        {session?.user ? (
          <SiteNav
            accountLabel={accountLabel}
            persona={persona}
            signOutAction={signOutAction}
          />
        ) : (
          <nav className="ml-auto flex items-center gap-2" aria-label="Akun">
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-full px-3.5 text-sm text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-3.5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Daftar
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
