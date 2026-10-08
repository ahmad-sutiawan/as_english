"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("demo@asenglish.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(
        res.error === "CredentialsSignin"
          ? "Email atau password salah. Akun ini sudah ada; password-nya adalah yang diketik saat daftar pertama, bukan yang ditolak di halaman daftar."
          : "Masuk gagal karena sesi tidak tersimpan. Muat ulang halaman, lalu coba lagi.",
      );
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
          Masuk
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Demo: demo@asenglish.local / demo1234
        </p>
      </div>
      <label className="block text-sm text-[var(--ink)]">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      <label className="block text-sm text-[var(--ink)]">
        Password
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Masuk…" : "Masuk"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Belum punya akun?{" "}
        <Link href="/register" className="text-[var(--accent)] underline">
          Daftar
        </Link>
      </p>
    </form>
  );
}
