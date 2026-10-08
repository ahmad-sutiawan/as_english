"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  action: () => Promise<void>;
  tone?: "neutral" | "danger";
  fullWidth?: boolean;
};

export function SignOutConfirm({
  action,
  tone = "neutral",
  fullWidth = false,
}: Props) {
  const titleId = useId();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (step === 0) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setStep(0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const buttonClass =
    tone === "danger"
      ? `inline-flex h-11 items-center justify-center rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[#2a1010] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)] ${fullWidth ? "w-full" : ""}`
      : "inline-flex h-10 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

  return (
    <>
      <button type="button" className={buttonClass} onClick={() => setStep(1)}>
        Keluar
      </button>

      {mounted && step >= 1
        ? createPortal(
        <div className="fixed inset-0 z-50 bg-black/55 px-4">
          <div className="grid h-full place-items-center">
            <div
              role="dialog"
              aria-modal={step === 1}
              aria-labelledby={titleId}
              inert={step === 2}
              className={`w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl ${
                step === 2 ? "-translate-y-16 opacity-70" : ""
              }`}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Konfirmasi 1 dari 2
              </p>
              <h2 id={titleId} className="mt-2 font-display text-2xl text-[var(--ink)]">
                Keluar dari akun?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Langkah berikutnya menanyakan sekali lagi sebelum sesi ditutup.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-11 items-center rounded-full px-4 text-sm text-[var(--ink)] hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  onClick={() => setStep(0)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  onClick={() => setStep(2)}
                >
                  Lanjut
                </button>
              </div>
            </div>
          </div>

          {step === 2 ? (
            <div className="absolute inset-0 grid place-items-center bg-black/45 px-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${titleId}-final`}
                className="w-full max-w-sm translate-y-8 rounded-3xl border border-[var(--danger-border)] bg-[var(--surface)] p-5 shadow-2xl"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--danger)]">
                  Konfirmasi 2 dari 2
                </p>
                <h2
                  id={`${titleId}-final`}
                  className="mt-2 font-display text-2xl text-[var(--ink)]"
                >
                  Tutup sesi sekarang?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  Akun akan keluar dan Anda kembali ke beranda.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center rounded-full px-4 text-sm text-[var(--ink)] hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                    onClick={() => setStep(1)}
                  >
                    Kembali
                  </button>
                  <form action={action}>
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center rounded-full border border-[var(--danger-border)] bg-[var(--danger)] px-4 text-sm font-medium text-[#2a1010] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)]"
                    >
                      Keluar sekarang
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : null}
        </div>,
          document.body,
        )
        : null}
    </>
  );
}
