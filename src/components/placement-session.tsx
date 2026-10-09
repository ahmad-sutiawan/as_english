"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Drill = {
  id: string;
  meaningId: string;
};

type Stored = {
  id: string;
  typed: string;
  passed: boolean;
};

export function PlacementSession() {
  const router = useRouter();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Stored[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/placement");
      const data = await res.json();
      setDrills((data.drills ?? []) as Drill[]);
    })();
  }, []);

  const drill = drills[index];

  async function finish(rows: Stored[]) {
    const res = await fetch("/api/placement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: rows.map((row) => ({ id: row.id, typed: row.typed })),
      }),
    });
    const result = await res.json();
    setDone(
      result.passed
        ? `Lulus ${result.correct} dari ${drills.length}. Tema percakapan terbuka.`
        : `${result.correct} dari ${drills.length} lulus. Ulangi penempatan; tema percakapan tetap tertutup.`,
    );
    if (result.passed) router.push("/practice");
  }

  function advance(rows: Stored[]) {
    const next = index + 1;
    if (next >= drills.length) {
      void finish(rows);
      return;
    }
    setAnswers(rows);
    setIndex(next);
    setTyped("");
    setNote(null);
  }

  async function check(event: React.FormEvent) {
    event.preventDefault();
    if (!drill || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: drill.id, typed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(data.error ?? "Gagal memeriksa.");
        setBusy(false);
        return;
      }
      const stored: Stored = { id: drill.id, typed, passed: Boolean(data.passed) };
      const nextAnswers = [...answers.filter((row) => row.id !== drill.id), stored];
      if (!data.passed) {
        const extra = (data.corrections as string[] | undefined)?.[0];
        setNote(extra ? `${data.headline} ${extra}` : data.headline);
        setAnswers(nextAnswers);
        setBusy(false);
        return;
      }
      advance(nextAnswers);
    } catch {
      setNote("Koneksi gagal.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="text-sm text-[var(--ink)]">{done}</p>;
  if (!drill) {
    return <p className="text-sm text-[var(--muted)]">Menyiapkan 12 kalimat dasar…</p>;
  }

  return (
    <form onSubmit={(event) => void check(event)} className="space-y-4">
      <p className="text-xs text-[var(--muted)]">
        {index + 1}/12 · ketik English dari arti
      </p>
      <p className="text-lg text-[var(--ink)]">{drill.meaningId}</p>
      <textarea
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        rows={3}
        required
        placeholder="Tulis kalimat English…"
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
      />
      {note ? (
        <div className="space-y-2">
          <p className="text-sm text-[var(--ink)]">{note}</p>
          <button
            type="button"
            onClick={() => advance(answers)}
            className="text-sm text-[var(--accent)]"
          >
            Lanjut tanpa menghitung lulus
          </button>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={busy || !typed.trim()}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] disabled:opacity-50"
      >
        Periksa
      </button>
    </form>
  );
}
