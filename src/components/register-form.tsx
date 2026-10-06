"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Registration failed");
      return;
    }

    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (login?.error) {
      setError("Registered, but auto-login failed. Please log in.");
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
          Create account
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Track workplace English progress across devices.
        </p>
      </div>
      <label className="block text-sm text-[var(--ink)]">
        Name
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
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
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Creating…" : "Register"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Already registered?{" "}
        <Link href="/login" className="text-[var(--accent)] underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
