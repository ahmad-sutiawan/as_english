"use client";

import { useState } from "react";
import Link from "next/link";
import { QuickSession } from "@/components/quick-session";
import { SpeakButton } from "@/components/speak-button";
import type { ExerciseItem } from "@/types/content";
import type { SpeakItem } from "@/types/speak";

type DueTask = {
  source: "module" | "build" | "speak";
  itemId: string;
  moduleId: string;
  meaningId: string;
  structureId: string;
  promptId: string;
};

type BuildTask = {
  id: string;
  meaningId: string;
  commandId: string;
  tokens: string[];
  distractors: string[];
};

type Plan = {
  due: DueTask[];
  build: BuildTask | null;
  speak: SpeakItem | null;
  module: ExerciseItem | null;
  moduleId: string;
  transfer: {
    itemId: string;
    scenario: string;
    scenarioId: string;
    meaningId: string;
  } | null;
};

type Step = "warmup" | "due" | "build" | "speak" | "module" | "transfer" | "done";

function shuffle(arr: string[]) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function PracticeSession() {
  const [step, setStep] = useState<Step>("warmup");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dueIndex, setDueIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pool, setPool] = useState<string[]>([]);
  const [arranged, setArranged] = useState<string[]>([]);
  const [heard, setHeard] = useState(false);
  const [moduleLayer, setModuleLayer] = useState<"recognize" | "produce">("recognize");

  async function loadPlan() {
    setError(null);
    const res = await fetch("/api/practice/plan", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Gagal menyusun sesi.");
      return;
    }
    setPlan(data);
    if (data.build) {
      setPool(shuffle([...data.build.tokens, ...data.build.distractors]));
    }
    setStep(data.due?.length ? "due" : data.build ? "build" : "speak");
  }

  async function submitDue(task: DueTask) {
    setBusy(true);
    setNote(null);
    try {
      let res: Response;
      if (task.source === "module") {
        res = await fetch("/api/progress/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId: task.moduleId,
            itemId: task.itemId,
            typedAnswer: typed,
          }),
        });
      } else if (task.source === "speak") {
        res = await fetch("/api/speak/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: task.itemId,
            phase: "say_again",
            transcript: typed,
            attemptSlot: 2,
          }),
        });
      } else {
        setNote("Susun chip transformasi pada langkah berikutnya.");
        setBusy(false);
        advanceDue();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memeriksa.");
        setBusy(false);
        return;
      }
      const passed = Boolean(data.exact || data.passed);
      setNote(passed ? "Tepat." : data.headline ?? "Belum tepat.");
      if (!passed) {
        setBusy(false);
        return;
      }
      setTyped("");
      setNote(null);
      advanceDue();
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setBusy(false);
    }
  }

  function advanceDue() {
    if (!plan) return;
    if (dueIndex + 1 < plan.due.length) {
      setDueIndex((value) => value + 1);
      return;
    }
    setStep(plan.build ? "build" : plan.speak ? "speak" : "module");
  }

  async function submitBuild() {
    if (!plan?.build) return;
    setBusy(true);
    const res = await fetch("/api/build/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drillId: plan.build.id,
        step: "transform",
        tokens: arranged,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.correct) {
      setNote(data.why ?? "Urutan belum tepat.");
      return;
    }
    setNote(null);
    setArranged([]);
    setStep(plan.speak ? "speak" : "module");
  }

  async function submitSpeak() {
    if (!plan?.speak) return;
    setBusy(true);
    const res = await fetch("/api/speak/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: plan.speak.id,
        phase: "say_again",
        transcript: typed,
        attemptSlot: 2,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.passed) {
      setNote(data.headline ?? "Belum tepat.");
      return;
    }
    setTyped("");
    setNote(null);
    setHeard(false);
    setModuleLayer("recognize");
    setStep(plan.module ? "module" : "transfer");
  }

  async function submitModule() {
    if (!plan?.module) return;
    setBusy(true);
    const res = await fetch("/api/progress/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: plan.moduleId,
        itemId: plan.module.id,
        typedAnswer: typed,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.exact) {
      setNote(data.headline ?? "Belum tepat.");
      return;
    }
    setTyped("");
    setNote(null);
    setStep("transfer");
  }

  async function submitTransfer() {
    if (!plan?.transfer) {
      setStep("done");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/speak/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: plan.transfer.itemId,
        phase: "scenario",
        transcript: typed,
        attemptSlot: 1,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.passed) {
      setNote(data.headline ?? "Belum tepat.");
      return;
    }
    setStep("done");
  }

  if (step === "warmup") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--muted)]">
          Pemanasan empat soal. Salah langsung masuk lapis keluarkan.
        </p>
        <QuickSession level="all" onDone={() => void loadPlan()} />
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      </div>
    );
  }

  if (!plan) return <p className="text-sm text-[var(--muted)]">Menyusun sisa sesi…</p>;

  if (step === "done") {
    return (
      <section className="space-y-3 rounded-md border border-[var(--success-border)] bg-[var(--success-bg)] p-5">
        <h2 className="font-display text-2xl text-[var(--success-ink)]">Putaran selesai</h2>
        <p className="text-sm text-[var(--ink)]">
          Item yang lulus masuk jadwal 1, 3, 7, 16, atau 35 hari.
        </p>
        <Link href="/dashboard" className="text-sm text-[var(--accent)]">
          Kembali ke papan
        </Link>
      </section>
    );
  }

  if (step === "due") {
    const task = plan.due[dueIndex];
    if (!task) return null;
    return (
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submitDue(task);
        }}
      >
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
          Jatuh tempo {dueIndex + 1}/{plan.due.length}
        </p>
        <p className="text-sm text-[var(--muted)]">{task.promptId}</p>
        <p className="text-base text-[var(--ink)]">{task.meaningId}</p>
        <p className="text-xs text-[var(--muted)]">{task.structureId}</p>
        <textarea
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          rows={3}
          required
          className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          placeholder="Ketik English tanpa melihat kalimat model"
        />
        {note ? <p className="text-sm">{note}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
        >
          Periksa
        </button>
      </form>
    );
  }

  if (step === "build" && plan.build) {
    return (
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">Susun</p>
        <p className="text-sm text-[var(--ink)]">{plan.build.meaningId}</p>
        <p className="text-sm text-[var(--muted)]">{plan.build.commandId}</p>
        <div className="flex min-h-12 flex-wrap gap-2 rounded-md border border-dashed border-[var(--accent)] p-3">
          {arranged.map((token, index) => (
            <button
              key={`${token}-${index}`}
              type="button"
              onClick={() => {
                setArranged((current) => current.filter((_, at) => at !== index));
                setPool((current) => [...current, token]);
              }}
              className="rounded-md border px-2 py-1 text-sm"
            >
              {token}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {pool.map((token, index) => (
            <button
              key={`${token}-p-${index}`}
              type="button"
              onClick={() => {
                setPool((current) => current.filter((_, at) => at !== index));
                setArranged((current) => [...current, token]);
              }}
              className="rounded-md border px-2 py-1 text-sm"
            >
              {token}
            </button>
          ))}
        </div>
        {note ? <p className="text-sm">{note}</p> : null}
        <button
          type="button"
          disabled={busy || arranged.length === 0}
          onClick={() => void submitBuild()}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
        >
          Cek transformasi
        </button>
      </section>
    );
  }

  if (step === "speak" && plan.speak) {
    return (
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">Bicara</p>
        {heard ? (
          <p className="text-sm text-[var(--ink)]">{plan.speak.targetId}</p>
        ) : (
          <>
            <p className="text-xl text-[var(--ink)]">{plan.speak.target}</p>
            <p className="text-sm text-[var(--muted)]">{plan.speak.targetId}</p>
          </>
        )}
        <SpeakButton text={plan.speak.target} label={heard ? "Dengar lagi" : "Dengar"} />
        {!heard ? (
          <button
            type="button"
            onClick={() => setHeard(true)}
            className="rounded-full border px-4 py-2 text-sm"
          >
            Sembunyikan teks dan ucapkan
          </button>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submitSpeak();
            }}
          >
            <textarea
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              rows={3}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ucapkan lalu ketik, atau ketik langsung"
            />
            {note ? <p className="text-sm">{note}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
            >
              Periksa ucapan
            </button>
          </form>
        )}
      </section>
    );
  }

  if (step === "module" && plan.module) {
    const item = plan.module;
    const correct = item.choices.find((choice) => choice.key === item.correctKey);
    return (
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">Soal baru</p>
        <p className="text-sm text-[var(--ink)]">{item.prompt}</p>
        <p className="text-sm text-[var(--muted)]">{item.promptId}</p>
        {moduleLayer === "recognize" ? (
          <ul className="space-y-2">
            {item.choices.map((choice) => (
              <li key={choice.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (choice.key === item.correctKey) setModuleLayer("produce");
                    else setNote("Bukan pilihan ini.");
                  }}
                  className="w-full rounded-md border px-3 py-3 text-left text-sm"
                >
                  {choice.key}. {choice.textId}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submitModule();
            }}
          >
            <p className="text-sm text-[var(--ink)]">{correct?.textId}</p>
            <textarea
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              rows={3}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
            >
              Periksa
            </button>
          </form>
        )}
        {note ? <p className="text-sm">{note}</p> : null}
      </section>
    );
  }

  if (step === "transfer" && plan.transfer) {
    return (
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submitTransfer();
        }}
      >
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">Transfer</p>
        <p className="text-sm text-[var(--ink)]">{plan.transfer.scenario}</p>
        <p className="text-sm text-[var(--muted)]">{plan.transfer.scenarioId}</p>
        <p className="text-sm text-[var(--ink)]">
          Sampaikan maksud ini: {plan.transfer.meaningId}
        </p>
        <textarea
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          rows={3}
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Beberapa kalimat model diterima"
        />
        {note ? <p className="text-sm">{note}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
        >
          Kirim
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStep("done")}
      className="text-sm text-[var(--accent)]"
    >
      Lanjut selesai
    </button>
  );
}
