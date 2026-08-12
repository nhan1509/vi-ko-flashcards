"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { revalidateStudyRelated, reviewCard } from "@/lib/actions";
import { haptic } from "@/lib/haptics";
import { speakKorean } from "@/lib/speak-ko";
import type { SrsGrade } from "@/lib/srs";

type StudyCard = {
  id: string;
  vi: string;
  ko: string;
  note: string | null;
  topic: { name: string };
};

type Topic = { id: string; name: string };

const SWIPE_FLIP = 48;
const SWIPE_GRADE = 88;

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
  const [pending, setPending] = useState(false);
  const [topicId, setTopicId] = useState(initialTopicId ?? "");
  const [onlyDue, setOnlyDue] = useState(initialOnlyDue);
  const [direction, setDirection] = useState<"ko-vi" | "vi-ko">(initialDirection);
  const [done, setDone] = useState(cards.length === 0);
  const [filtersOpen, setFiltersOpen] = useState(cards.length === 0);
  const [speakMsg, setSpeakMsg] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"h" | "v" | null>(null);
  const cardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragXRef = useRef(0);
  const flippedRef = useRef(flipped);
  const gradeRef = useRef<(g: SrsGrade) => void>(() => undefined);
  const indexRef = useRef(index);
  const queueLenRef = useRef(queue.length);
  flippedRef.current = flipped;
  indexRef.current = index;
  queueLenRef.current = queue.length;

  const current = queue[index];
  const studying = !done && !!current;

  const progress = useMemo(() => {
    if (queue.length === 0) return "0/0";
    return `${Math.min(index + 1, queue.length)}/${queue.length}`;
  }, [index, queue.length]);

  function goStudy(opts: {
    topic?: string;
    due?: boolean;
    dir?: "ko-vi" | "vi-ko";
    remount?: boolean;
  }) {
    const params = new URLSearchParams();
    const t = opts.topic ?? topicId;
    if (t) params.set("topic", t);
    params.set("due", (opts.due ?? onlyDue) ? "1" : "0");
    params.set("dir", opts.dir ?? direction);
    if (opts.remount) params.set("r", String(Date.now()));
    router.push(`/study?${params.toString()}`);
  }

  function scheduleFilterApply(next: {
    topicId?: string;
    onlyDue?: boolean;
  }) {
    if (filterTimer.current) clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => {
      goStudy({
        topic: next.topicId ?? topicId,
        due: next.onlyDue ?? onlyDue,
        remount: true,
      });
    }, 400);
  }

  function onSpeak() {
    if (!current) return;
    const result = speakKorean(current.ko);
    if (!result.ok) {
      setSpeakMsg(result.message ?? "Không phát được");
      haptic([20, 40, 20]);
    } else {
      setSpeakMsg(null);
      haptic(8);
    }
  }

  function grade(g: SrsGrade) {
    if (!current || pending) return;
    const cardId = current.id;
    const atEnd = indexRef.current >= queueLenRef.current - 1;

    // Optimistic UI: advance immediately, persist in background (Turso latency).
    setPending(true);
    haptic(g === "again" ? [18, 30, 18] : 14);
    setFlipped(false);
    setDragX(0);
    if (atEnd) {
      setDone(true);
      setFiltersOpen(true);
      setQueue((prev) => prev.slice(0, indexRef.current));
      void revalidateStudyRelated();
    } else {
      setIndex((i) => i + 1);
    }
    setPending(false);

    void reviewCard(cardId, g).catch(() => {
      // Keep UX snappy; failures are rare — user can re-grade later if needed.
    });
  }

  gradeRef.current = grade;

  useEffect(() => {
    type Orient = ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
      unlock?: () => void;
    };
    const orient = screen.orientation as Orient | undefined;
    if (studying && orient?.lock) {
      orient.lock("portrait").catch(() => undefined);
    }
    return () => {
      try {
        orient?.unlock?.();
      } catch {
        // ignore
      }
    };
  }, [studying]);

  useEffect(() => {
    const el = cardSurfaceRef.current;
    if (!el || !studying) return;

    const onStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
      axis.current = null;
      dragXRef.current = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      if (!axis.current) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        axis.current = Math.abs(dx) > Math.abs(dy) * 1.15 ? "h" : "v";
      }
      if (axis.current === "h") {
        e.preventDefault();
        dragXRef.current = dx;
        setDragX(dx);
      }
    };

    const onEnd = () => {
      const dx = dragXRef.current;
      const wasH = axis.current === "h";
      touchStart.current = null;
      axis.current = null;
      dragXRef.current = 0;
      setDragX(0);

      if (!wasH) return;

      if (flippedRef.current && Math.abs(dx) > SWIPE_GRADE) {
        gradeRef.current(dx < 0 ? "again" : "good");
        return;
      }

      if (Math.abs(dx) > SWIPE_FLIP) {
        setFlipped((f) => !f);
        haptic(10);
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [studying, current?.id]);

  const front = current ? (direction === "ko-vi" ? current.ko : current.vi) : "";
  const back = current ? (direction === "ko-vi" ? current.vi : current.ko) : "";
  const frontIsKo = direction === "ko-vi";
  const swipeHint =
    Math.abs(dragX) > 24
      ? dragX < 0
        ? flipped
          ? "← Again"
          : "Lật"
        : flipped
          ? "Good →"
          : "Lật"
      : null;

  return (
    <div
      className={`flex flex-col overflow-x-hidden ${
        studying ? "min-h-[calc(100dvh-8.5rem)] overscroll-y-contain md:min-h-0" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2 md:mb-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold md:text-3xl">Phiên học SRS</h1>
          <p className="hidden text-muted md:mt-1 md:block">
            Chạm để lật · vuốt ngang: lật / Again–Good khi đã lật.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="shrink-0 rounded-lg border border-line bg-card px-3 py-2 text-sm"
        >
          {filtersOpen ? "Ẩn lọc" : "Bộ lọc"}
        </button>
      </div>

      {filtersOpen && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-line bg-card p-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1 text-sm">
            <span>Chủ đề</span>
            <select
              value={topicId}
              onChange={(e) => {
                const v = e.target.value;
                setTopicId(v);
                scheduleFilterApply({ topicId: v });
              }}
              className="w-full rounded-md border border-line bg-bg px-3 py-2.5 text-base md:text-sm"
            >
              <option value="">Tất cả</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-5"
              checked={onlyDue}
              onChange={(e) => {
                const v = e.target.checked;
                setOnlyDue(v);
                scheduleFilterApply({ onlyDue: v });
              }}
            />
            Chỉ thẻ đến hạn
          </label>
          <label className="space-y-1 text-sm sm:w-40">
            <span>Hướng</span>
            <select
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as "ko-vi" | "vi-ko");
              }}
              className="w-full rounded-md border border-line bg-bg px-3 py-2.5 text-base md:text-sm"
            >
              <option value="ko-vi">Hàn → Việt</option>
              <option value="vi-ko">Việt → Hàn</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => goStudy({ remount: true })}
            className="min-h-11 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white"
          >
            Xáo trộn lại
          </button>
        </div>
      )}

      {done || !current ? (
        <div className="animate-rise rounded-2xl border border-line bg-card p-8 text-center md:p-10">
          <p className="ko text-accent">완료!</p>
          <h2 className="mt-2 text-2xl font-semibold">Hết thẻ trong phiên này</h2>
          <p className="mt-2 text-sm text-muted md:text-base">
            Thẻ vừa học đã được lên lịch ôn sau. Học tiếp ngay bằng nút bên dưới.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <button
              type="button"
              className="min-h-12 rounded-md bg-accent px-4 py-3 text-sm font-medium text-white"
              onClick={() => goStudy({ due: false, remount: true })}
            >
              Học lại tất cả thẻ
            </button>
            <button
              type="button"
              className="min-h-12 rounded-md border border-line px-4 py-3 text-sm"
              onClick={() => goStudy({ due: true, remount: true })}
            >
              Tải lại thẻ đến hạn
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-2 text-sm text-muted">
            <span className="truncate">
              {current.topic.name} · {progress}
            </span>
            <button
              type="button"
              className="min-h-10 shrink-0 rounded-md px-2 text-accent"
              onClick={onSpeak}
            >
              Phát âm Hàn
            </button>
          </div>
          {speakMsg && (
            <p className="text-center text-xs text-warn">
              {speakMsg}{" "}
              <button type="button" className="underline" onClick={onSpeak}>
                Thử lại
              </button>
            </p>
          )}

          <div ref={cardSurfaceRef} className="relative flex flex-1 overflow-hidden overscroll-contain">
            {swipeHint && (
              <p className="pointer-events-none absolute inset-x-0 top-2 z-10 text-center text-sm font-medium text-accent">
                {swipeHint}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setFlipped((f) => !f);
                haptic(8);
              }}
              style={{
                transform: `translate3d(${dragX * 0.35}px,0,0) rotate(${dragX * 0.02}deg)`,
              }}
              className="animate-flip-in study-card flex min-h-[42vh] w-full flex-col items-center justify-center rounded-2xl border border-line bg-card px-5 py-12 text-center shadow-sm transition-[border-color] will-change-transform hover:border-accent md:min-h-[280px] md:py-16"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {flipped ? "Mặt sau" : "Mặt trước"} · chạm để lật · vuốt ngang
              </p>
              <p
                className={`mt-4 text-4xl font-semibold leading-tight sm:text-5xl ${
                  (flipped ? !frontIsKo : frontIsKo) ? "ko" : ""
                }`}
              >
                {flipped ? back : front}
              </p>
              {flipped && current.note && (
                <p className="mt-4 text-sm text-muted">{current.note}</p>
              )}
            </button>
          </div>

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
                  className={`min-h-14 rounded-xl px-3 py-3 text-base font-semibold disabled:opacity-60 ${cls}`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="pb-1 text-center text-sm text-muted">
              Lật thẻ rồi chấm — hoặc vuốt trái/phải (Again/Good)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
