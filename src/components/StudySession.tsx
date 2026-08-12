"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewCard } from "@/lib/actions";
import type { SrsGrade } from "@/lib/srs";

type StudyCard = {
  id: string;
  vi: string;
  ko: string;
  note: string | null;
  topic: { name: string };
};

type Topic = { id: string; name: string };

export function StudySession({
  cards,
  topics,
  initialTopicId,
  initialOnlyDue,
  initialDirection,
}: {
  cards: StudyCard[];
  topics: Topic[];
  initialTopicId?: string;
  initialOnlyDue: boolean;
  initialDirection: "ko-vi" | "vi-ko";
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [queue, setQueue] = useState(cards);
  const [pending, startTransition] = useTransition();
  const [topicId, setTopicId] = useState(initialTopicId ?? "");
  const [onlyDue, setOnlyDue] = useState(initialOnlyDue);
  const [direction, setDirection] = useState<"ko-vi" | "vi-ko">(initialDirection);
  const [done, setDone] = useState(cards.length === 0);

  const current = queue[index];

  const progress = useMemo(() => {
    if (queue.length === 0) return "0/0";
    return `${Math.min(index + 1, queue.length)}/${queue.length}`;
  }, [index, queue.length]);

  function speakKorean(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    window.speechSynthesis.speak(utter);
  }

  function goStudy(opts?: { due?: boolean; remount?: boolean }) {
    const params = new URLSearchParams();
    if (topicId) params.set("topic", topicId);
    params.set("due", (opts?.due ?? onlyDue) ? "1" : "0");
    params.set("dir", direction);
    if (opts?.remount) params.set("r", String(Date.now()));
    router.push(`/study?${params.toString()}`);
  }

  function applyFilters() {
    goStudy({ remount: true });
  }

  function grade(g: SrsGrade) {
    if (!current) return;
    startTransition(async () => {
      await reviewCard(current.id, g);
      setFlipped(false);
      if (index >= queue.length - 1) {
        setDone(true);
        setQueue((prev) => prev.slice(0, index));
      } else {
        setIndex((i) => i + 1);
      }
    });
  }

  const front = current ? (direction === "ko-vi" ? current.ko : current.vi) : "";
  const back = current ? (direction === "ko-vi" ? current.vi : current.ko) : "";
  const frontIsKo = direction === "ko-vi";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-card p-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 text-sm">
          <span>Chủ đề</span>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-3 py-2"
          >
            <option value="">Tất cả</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} />
          Chỉ thẻ đến hạn
        </label>
        <label className="space-y-1 text-sm">
          <span>Hướng</span>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "ko-vi" | "vi-ko")}
            className="w-full rounded-md border border-line bg-bg px-3 py-2"
          >
            <option value="ko-vi">Hàn → Việt</option>
            <option value="vi-ko">Việt → Hàn</option>
          </select>
        </label>
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Áp dụng / Xáo trộn
        </button>
      </div>

      {done || !current ? (
        <div className="animate-rise rounded-2xl border border-line bg-card p-10 text-center">
          <p className="ko text-accent">완료!</p>
          <h2 className="mt-2 text-2xl font-semibold">Hết thẻ trong phiên này</h2>
          <p className="mt-2 text-muted">
            Thẻ vừa học đã được lên lịch ôn sau. Muốn học tiếp ngay: bỏ tick “Chỉ thẻ đến hạn” rồi bấm
            Áp dụng, hoặc dùng nút bên dưới.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className="rounded-md bg-accent px-4 py-2 text-sm text-white"
              onClick={() => goStudy({ due: false, remount: true })}
            >
              Học lại tất cả thẻ
            </button>
            <button
              type="button"
              className="rounded-md border border-line px-4 py-2 text-sm"
              onClick={() => goStudy({ due: true, remount: true })}
            >
              Tải lại thẻ đến hạn
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              {current.topic.name} · {progress}
            </span>
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => speakKorean(current.ko)}
            >
              Phát âm Hàn
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="animate-flip-in group w-full rounded-2xl border border-line bg-card px-6 py-16 text-center shadow-sm transition hover:border-accent"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {flipped ? "Mặt sau" : "Mặt trước"} · bấm để lật
            </p>
            <p
              className={`mt-4 text-4xl font-semibold sm:text-5xl ${
                (flipped ? !frontIsKo : frontIsKo) ? "ko" : ""
              }`}
            >
              {flipped ? back : front}
            </p>
            {flipped && current.note && (
              <p className="mt-4 text-sm text-muted">{current.note}</p>
            )}
          </button>

          {flipped ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ["again", "Again", "bg-danger text-white"],
                  ["hard", "Hard", "bg-warn text-white"],
                  ["good", "Good", "bg-good text-white"],
                  ["easy", "Easy", "bg-accent text-white"],
                ] as const
              ).map(([g, label, cls]) => (
                <button
                  key={g}
                  type="button"
                  disabled={pending}
                  onClick={() => grade(g)}
                  className={`rounded-md px-3 py-3 text-sm font-medium disabled:opacity-60 ${cls}`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted">Lật thẻ rồi chọn Again / Hard / Good / Easy</p>
          )}
        </div>
      )}
    </div>
  );
}
