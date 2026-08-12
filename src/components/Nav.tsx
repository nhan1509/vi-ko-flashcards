import Link from "next/link";

const links = [
  { href: "/", label: "Tổng quan" },
  { href: "/study", label: "Học" },
  { href: "/cards/new", label: "Thêm từ" },
  { href: "/cards", label: "Quản lý" },
  { href: "/import", label: "Import" },
  { href: "/topics", label: "Chủ đề" },
];

export function Nav({ pathname }: { pathname: string }) {
  return (
    <header className="border-b border-line/80 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="group">
          <p className="ko text-lg font-semibold tracking-tight text-accent">단어장</p>
          <p className="text-sm text-muted group-hover:text-ink">Flashcard Việt–Hàn</p>
        </Link>
        <nav className="flex flex-wrap gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
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
  );
}
