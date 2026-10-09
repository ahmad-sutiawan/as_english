"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PersonaId } from "@/lib/persona";

const CHOICES: {
  id: PersonaId;
  title: string;
  detail: string;
}[] = [
  {
    id: "it",
    title: "Kerja IT",
    detail: "Wawancara, standup, insiden, update manager, dan percakapan engineering.",
  },
  {
    id: "home",
    title: "Rumah",
    detail: "Keluarga, dapur, tetangga, sekolah, dan urusan sehari-hari di rumah.",
  },
];

export function PersonaPicker() {
  const router = useRouter();
  const [pending, setPending] = useState<PersonaId | null>(null);
  const [error, setError] = useState("");

  async function choose(persona: PersonaId) {
    setPending(persona);
    setError("");
    const response = await fetch("/api/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona }),
    });
    if (!response.ok) {
      setPending(null);
      setError("Pilihan belum tersimpan. Coba lagi.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="dash-shell">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">Dunia latihan</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-[var(--ink)] sm:text-5xl">
          Pilih persona
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)]">
          Seluruh modul, Susun, Bicara, Cepat, dan Review mengikuti dunia ini. Kamu bisa ganti
          nanti dari menu.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              disabled={pending !== null}
              onClick={() => choose(choice.id)}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-6 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)] disabled:opacity-60"
            >
              <span className="font-display text-3xl text-[var(--ink)]">{choice.title}</span>
              <span className="mt-3 block text-sm leading-relaxed text-[var(--muted)]">
                {choice.detail}
              </span>
              <span className="mt-5 inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[#06221e]">
                {pending === choice.id ? "Menyimpan…" : "Pakai dunia ini"}
              </span>
            </button>
          ))}
        </div>
        {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      </div>
    </div>
  );
}
