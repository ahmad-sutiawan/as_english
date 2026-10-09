"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Drill = {
  id: string;
  meaningId: string;
  tokens: string[];
  distractors: string[];
};

function shuffle(arr: string[]) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function PlacementSession() {
  const router = useRouter();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [pool, setPool] = useState<string[]>([]);
  const [arranged, setArranged] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/placement");
      const data = await res.json();
      const list = (data.drills ?? []) as Drill[];
      setDrills(list);
      if (list[0]) setPool(shuffle([...list[0].tokens, ...list[0].distractors]));
    })();
  }, []);

  const drill = drills[index];

  async function check() {
    if (!drill) return;
    const res = await fetch("/api/build/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drillId: drill.id, step: "assemble", tokens: arranged }),
    });
    const data = await res.json();
    const nextCorrect = correct + (data.correct ? 1 : 0);
    if (!data.correct) setNote("Urutan belum tepat. Lanjut ke kalimat berikut.");
    const next = index + 1;
    window.setTimeout(async () => {
      if (next >= drills.length) {
        const finish = await fetch("/api/placement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correct: nextCorrect }),
        });
        const result = await finish.json();
        setDone(
          result.passed
            ? "Urutan kata dasar sudah cukup. Tema percakapan terbuka."
            : "Masih di tema Dasar. Ulangi penempatan saat urutan kata terasa otomatis.",
        );
        if (result.passed) router.push("/practice");
        return;
      }
      setCorrect(nextCorrect);
      setIndex(next);
      setArranged([]);
      setNote(null);
      const upcoming = drills[next];
      setPool(shuffle([...upcoming.tokens, ...upcoming.distractors]));
    }, data.correct ? 400 : 900);
  }

  if (done) {
    return <p className="text-sm text-[var(--ink)]">{done}</p>;
  }
  if (!drill) return <p className="text-sm text-[var(--muted)]">Menyiapkan 12 kalimat dasar…</p>;

  return (
    <section className="space-y-4">
      <p className="text-xs text-[var(--muted)]">
        {index + 1}/12 · {drill.meaningId}
      </p>
      <div className="flex min-h-12 flex-wrap gap-2 rounded-md border border-dashed p-3">
        {arranged.map((token, tokenIndex) => (
          <button
            key={`${token}-${tokenIndex}`}
            type="button"
            className="rounded-md border px-2 py-1 text-sm"
            onClick={() => {
              setArranged((current) => current.filter((_, at) => at !== tokenIndex));
              setPool((current) => [...current, token]);
            }}
          >
            {token}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map((token, tokenIndex) => (
          <button
            key={`${token}-p-${tokenIndex}`}
            type="button"
            className="rounded-md border px-2 py-1 text-sm"
            onClick={() => {
              setPool((current) => current.filter((_, at) => at !== tokenIndex));
              setArranged((current) => [...current, token]);
            }}
          >
            {token}
          </button>
        ))}
      </div>
      {note ? <p className="text-sm">{note}</p> : null}
      <button
        type="button"
        disabled={arranged.length === 0}
        onClick={() => void check()}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] disabled:opacity-50"
      >
        Cek
      </button>
    </section>
  );
}
