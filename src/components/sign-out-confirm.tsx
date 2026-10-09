"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  action: () => Promise<void>;
  fullWidth?: boolean;
};

export function SignOutConfirm({ action, fullWidth = false }: Props) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const buttonClass = `inline-flex items-center justify-center border border-[var(--danger-border)] bg-[var(--danger-bg)] font-medium text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[#2a1010] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)] ${
    fullWidth ? "h-11 w-full rounded-xl px-4 text-sm" : "h-10 rounded-full px-3.5 text-sm"
  }`;

  return (
    <>
      <button type="button" className={buttonClass} onClick={() => setOpen(true)}>
        Keluar
      </button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-50 bg-black/55 px-4">
              <div className="grid h-full place-items-center">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  className="w-full max-w-sm rounded-3xl border border-[var(--danger-border)] bg-[var(--surface)] p-5 shadow-2xl"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--danger)]">
                    Konfirmasi
                  </p>
                  <h2 id={titleId} className="mt-2 font-display text-2xl text-[var(--danger)]">
                    Keluar dari akun?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--danger)]">
                    Akun akan keluar dan Anda kembali ke beranda.
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex h-11 items-center rounded-full border border-[var(--danger-border)] px-4 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)]"
                      onClick={() => setOpen(false)}
                    >
                      Batal
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
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
