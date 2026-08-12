"use client";

import Link from "next/link";
import { useState } from "react";

const primary = [
  { href: "/", label: "Tổng quan", match: (p: string) => p === "/" },
  { href: "/study", label: "Học", match: (p: string) => p.startsWith("/study") },
  { href: "/cards/new", label: "Thêm", match: (p: string) => p.startsWith("/cards/new") },
  { href: "/cards", label: "Từ", match: (p: string) => p === "/cards" || (p.startsWith("/cards") && !p.startsWith("/cards/new")) },
];

const moreLinks = [
  { href: "/import", label: "Import" },
  { href: "/topics", label: "Chủ đề" },
];

export function Nav({ pathname }: { pathname: string }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreLinks.some((l) => pathname.startsWith(l.href));

  return (
    <>
      {/* Desktop / tablet top nav */}
      <header className="hidden border-b border-line/80 bg-card/80 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="group">
            <p className="ko text-lg font-semibold tracking-tight text-accent">단어장</p>
            <p className="text-sm text-muted group-hover:text-ink">Flashcard Việt–Hàn</p>
          </Link>
          <nav className="flex flex-wrap gap-1">
            {[...primary, ...moreLinks].map((link) => {
              const active =
                "match" in link && typeof link.match === "function"
                  ? link.match(pathname)
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    active
                      ? "bg-accent text-white"
                      : "text-muted hover:bg-accent-soft hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile brand strip */}
      <header className="border-b border-line/80 bg-card/80 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/">
            <p className="ko text-base font-semibold text-accent">단어장</p>
            <p className="text-xs text-muted">Việt–Hàn</p>
          </Link>
          <p className="text-xs text-muted">Học trên điện thoại</p>
        </div>
      </header>

      {/* Mobile bottom tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="Điều hướng chính"
      >
        <ul className="grid grid-cols-5">
          {primary.map((link) => {
            const active = link.match(pathname);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  <TabIcon name={link.label} active={active} />
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                moreOpen || moreActive ? "text-accent" : "text-muted"
              }`}
            >
              <TabIcon name="Thêm…" active={moreOpen || moreActive} />
              Thêm…
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Đóng"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-line bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg">
            <p className="mb-3 text-sm font-semibold">Thêm</p>
            <ul className="space-y-1">
              {moreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`block rounded-lg px-4 py-3 text-sm ${
                      pathname.startsWith(link.href)
                        ? "bg-accent-soft font-medium text-accent"
                        : "hover:bg-bg-accent"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-line py-3 text-sm"
              onClick={() => setMoreOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "var(--accent)" : "currentColor";
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "Tổng quan":
      return (
        <svg {...common}>
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6.5 10.5V20h11V10.5" />
        </svg>
      );
    case "Học":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M12 5v14" />
        </svg>
      );
    case "Thêm":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "Từ":
      return (
        <svg {...common}>
          <path d="M8 6h12M8 12h12M8 18h8" />
          <path d="M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.2" fill={stroke} stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill={stroke} stroke="none" />
          <circle cx="18" cy="12" r="1.2" fill={stroke} stroke="none" />
        </svg>
      );
  }
}
