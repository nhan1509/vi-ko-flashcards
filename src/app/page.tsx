import Link from "next/link";
import { getDashboardStats, listTopics } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, topics] = await Promise.all([getDashboardStats(), listTopics()]);

  const tiles = [
    { label: "Đến hạn hôm nay", value: stats.due, hint: "Nên học ngay" },
    { label: "Tổng thẻ", value: stats.cards, hint: `${stats.topics} chủ đề` },
    { label: "Đã thuộc", value: stats.known, hint: "status known" },
    { label: "Đang học", value: stats.learning + stats.hard + stats.news, hint: "còn ôn" },
  ];

  const studyLabel =
    stats.due > 0 ? `Tiếp tục học (${stats.due} thẻ)` : "Học tất cả thẻ";
  const studyHref = stats.due > 0 ? "/study" : "/study?due=0";

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="animate-rise space-y-4">
        <p className="ko text-sm font-medium text-accent">안녕하세요</p>
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
          Flashcard Việt–Hàn
        </h1>
        <p className="max-w-lg text-muted">
          Ôn từ theo SRS trên điện thoại — thẻ lớn, vuốt để lật và chấm điểm.
        </p>

        <Link
          href={studyHref}
          className="flex min-h-[4.5rem] w-full items-center justify-center rounded-2xl bg-accent px-5 py-5 text-center text-lg font-semibold text-white shadow-sm hover:opacity-95 sm:max-w-md sm:text-xl"
        >
          {studyLabel}
        </Link>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/cards/new"
            className="min-h-11 rounded-md border border-line bg-card px-5 py-2.5 text-sm font-medium hover:bg-accent-soft"
          >
            Thêm từ thủ công
          </Link>
          <Link
            href="/import"
            className="min-h-11 rounded-md border border-line bg-card px-5 py-2.5 text-sm font-medium hover:bg-accent-soft"
          >
            Import
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile, i) => (
          <div
            key={tile.label}
            className="animate-rise rounded-xl border border-line bg-card p-4"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-sm text-muted">{tile.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{tile.value}</p>
            <p className="mt-1 text-xs text-muted">{tile.hint}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Chủ đề</h2>
          <Link href="/topics" className="text-sm text-accent hover:underline">
            Quản lý
          </Link>
        </div>
        {topics.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-card/60 p-6 text-sm text-muted">
            Chưa có chủ đề. Thêm từ thủ công hoặc import CSV để bắt đầu.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/study?topic=${topic.id}`}
                  className="flex min-h-14 items-center justify-between rounded-xl border border-line bg-card px-4 py-3 transition hover:border-accent"
                >
                  <span className="font-medium">{topic.name}</span>
                  <span className="text-sm text-muted">{topic._count.cards} từ</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
