"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizeAnswer } from "@/lib/answer";
import { speak } from "@/lib/tts";
import { SpeakMicButton } from "@/components/speak-mic-button";
import type { Difficulty } from "@/types/content";
import type { QuickCard } from "@/types/quick";

type LevelFilter = Difficulty | "all";

type Stage = "produce" | "lock";

export function QuickSprint({ level }: { level: LevelFilter }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<QuickCard[]>([]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("produce");
  const [slot, setSlot] = useState<1 | 2>(1);
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [passed, setPassed] = useState(0);
  const [repaired, setRepaired] = useState(0);
  const [done, setDone] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDone(false);
    setIndex(0);
    setStage("produce");
    setSlot(1);
    setTyped("");
    setNote(null);
    setModel("");
    setPassed(0);
    setRepaired(0);
    try {
      const res = await fetch("/api/quick/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat sesi.");
        setItems([]);
        return;
      }
      setItems(data.items);
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  function advance(kind: "pass" | "repair") {
    if (kind === "pass") setPassed((value) => value + 1);
    else setRepaired((value) => value + 1);
    const next = index + 1;
    if (next >= items.length) {
      setDone(true);
      return;
    }
    setIndex(next);
    setStage("produce");
    setSlot(1);
    setTyped("");
    setNote(null);
    setModel("");
  }

  async function submitProduce(event: React.FormEvent) {
    event.preventDefault();
    const card = items[index];
    if (!card || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/quick/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: card.moduleId,
          itemId: card.itemId,
          typed,
          attemptSlot: slot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memeriksa.");
        setBusy(false);
        return;
      }
      if (data.passed) {
        if (data.expected) speak(data.expected);
        advance(slot === 1 ? "pass" : "repair");
        setBusy(false);
        return;
      }
      if (slot === 1) {
        const hint = data.correction || data.headline || "Belum tepat.";
        const missed = Array.isArray(data.missedTokens)
          ? data.missedTokens.slice(0, 4).join(", ")
          : "";
        setNote(missed ? `${hint} Belum kena: ${missed}` : hint);
        setSlot(2);
        setBusy(false);
        return;
      }
      setModel(data.expected ?? "");
      setStage("lock");
      setTyped("");
      setNote("Kalimat dibuka. Ketik persis, lalu lanjut.");
      setBusy(false);
    } catch {
      setError("Koneksi gagal.");
      setBusy(false);
    }
  }

  function submitLock(event: React.FormEvent) {
    event.preventDefault();
    if (normalizeAnswer(typed) !== normalizeAnswer(model)) {
      setNote("Belum sama. Ketik kalimat yang terbuka.");
      return;
    }
    speak(model);
    advance("repair");
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Menyiapkan empat kalimat…</p>;
  }

  if (error && items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--danger)]">{error}</p>
        <Link href="/quick" className="text-sm text-[var(--accent)]">
          Kembali
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <section className="space-y-4 rounded-md border border-[var(--success-border)] bg-[var(--success-bg)] p-5">
        <h2 className="font-display text-2xl text-[var(--success-ink)]">Empat kalimat selesai</h2>
        <p className="text-sm text-[var(--ink)]">
          Langsung tepat: {passed}. Diperbaiki: {repaired}.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadSession()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
          >
            Empat lagi
          </button>
          <Link href="/quick" className="rounded-md border px-4 py-2 text-sm">
            Ganti level
          </Link>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Papan
          </button>
        </div>
      </section>
    );
  }

  const card = items[index];
  if (!card) return null;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        if (stage === "lock") submitLock(event);
        else void submitProduce(event);
      }}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
        {index + 1}/{items.length} · {card.moduleTitleId}
      </p>
      <p className="text-sm text-[var(--muted)]">{card.scenarioId}</p>
      <p className="text-xl leading-snug text-[var(--ink)]">{card.targetId}</p>
      {stage === "lock" ? (
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--ink)]">
          {model}
        </p>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          {slot === 1 ? "Keluarkan English dari arti ini." : "Satu petunjuk. Coba lagi."}
        </p>
      )}
      <SpeakMicButton onTranscript={setTyped} disabled={busy} />
      <textarea
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        rows={3}
        required
        className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
        placeholder={stage === "lock" ? "Ketik kalimat yang terbuka" : "Ucapkan atau ketik English"}
      />
      {note ? <p className="text-sm text-[var(--ink)]">{note}</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy || !typed.trim()}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] disabled:opacity-50"
      >
        {stage === "lock" ? "Kunci" : "Periksa"}
      </button>
    </form>
  );
}
