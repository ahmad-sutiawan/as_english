import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BuildSession } from "@/components/build-session";

export default async function BuildPlayPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/build"
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Lobby Susun
      </Link>
      <h1 className="mt-4 font-display text-2xl tracking-tight text-[var(--ink)]">
        Sesi susun
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Susun dulu, lalu ubah bentuk kalimat yang sama.
      </p>
      <div className="mt-8">
        <BuildSession />
      </div>
    </div>
  );
}
