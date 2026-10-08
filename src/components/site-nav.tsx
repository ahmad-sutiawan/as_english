"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutConfirm } from "@/components/sign-out-confirm";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/build", label: "Susun" },
  { href: "/quick", label: "Cepat" },
  { href: "/speak", label: "Bicara" },
  { href: "/review", label: "Review" },
  { href: "/guide", label: "Panduan" },
] as const;

type Props = {
  accountLabel: string;
  signOutAction: () => Promise<void>;
};

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ accountLabel, signOutAction }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="ml-auto hidden lg:block" aria-label="Utama">
        <ul className="flex items-center gap-1">
          {LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  className={`inline-flex h-10 items-center rounded-full px-3.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                    current
                      ? "bg-[var(--accent-soft)] font-medium text-[var(--ink)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="ml-auto flex items-center gap-2 lg:ml-3">
        <p className="hidden max-w-40 truncate text-sm text-[var(--muted)] lg:block" title={accountLabel}>
          {accountLabel}
        </p>
        <div className="hidden lg:block">
          <SignOutConfirm action={signOutAction} />
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Tutup" : "Menu"}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-16 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur lg:hidden"
        >
          <nav aria-label="Utama">
            <ul className="grid gap-1">
              {LINKS.map((link) => {
                const current = isCurrent(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={current ? "page" : undefined}
                      className={`flex h-11 items-center rounded-xl px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                        current
                          ? "bg-[var(--accent-soft)] font-medium text-[var(--ink)]"
                          : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <p className="truncate text-sm text-[var(--muted)]" title={accountLabel}>
              {accountLabel}
            </p>
            <div className="mt-3">
              <SignOutConfirm action={signOutAction} tone="danger" fullWidth />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
