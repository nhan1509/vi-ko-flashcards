"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteAllCards, deleteCard, updateCard } from "@/lib/actions";
import { haptic } from "@/lib/haptics";

type CardRow = {
  id: string;
  vi: string;
  ko: string;
  note: string | null;
  topicId: string;
  topic: { id: string; name: string };
  review: { status: string; dueAt: Date | string } | null;
};

type Topic = { id: string; name: string };

export function CardsTable({
  cards: allCards,
  topics,
  initialTopicId,
  initialStatus,
  initialSearch,
}: {
  cards: CardRow[];
  topics: Topic[];
  initialTopicId?: string;
  initialStatus?: string;
  initialSearch?: string;
}) {
  const [topicId, setTopicId] = useState(initialTopicId ?? "");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [rows, setRows] = useState(allCards);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    setRows(allCards);
  }, [allCards]);

  const cards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((card) => {
      if (topicId && card.topicId !== topicId) return false;
      if (status && (card.review?.status ?? "new") !== status) return false;
      if (!q) return true;
      return (
        card.vi.toLowerCase().includes(q) ||
        card.ko.toLowerCase().includes(q) ||
        (card.note?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, topicId, status, search]);

  function removeLocal(id: string) {
    setRows((prev) => prev.filter((c) => c.id !== id));
  }

  function applyLocalUpdate(data: {
    id: string;
    topicId: string;
    vi: string;
    ko: string;
    note?: string;
  }) {
    setRows((prev) =>
      prev.map((c) =>
        c.id === data.id
          ? {
              ...c,
              vi: data.vi,
              ko: data.ko,
              note: data.note ?? null,
              topicId: data.topicId,
              topic: topics.find((t) => t.id === data.topicId) ?? c.topic,
            }
          : c,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-card p-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 text-sm">
          <span>Chủ đề</span>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
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
        <label className="flex-1 space-y-1 text-sm">
          <span>Trạng thái</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-3 py-2.5 text-base md:text-sm"
          >
            <option value="">Tất cả</option>
            <option value="new">Mới</option>
            <option value="learning">Đang học</option>
            <option value="hard">Khó</option>
            <option value="known">Thuộc</option>
          </select>
        </label>
        <label className="flex-[1.4] space-y-1 text-sm">
          <span>Tìm</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-3 py-2.5 text-base md:text-sm"
            placeholder="vi / ko / note"
          />
        </label>
        <Link
          href="/cards/new"
          className="min-h-11 rounded-md border border-line px-4 py-2.5 text-center text-sm hover:bg-accent-soft"
        >
          Thêm từ
        </Link>
        <button
          type="button"
          disabled={pending}
          className="min-h-11 rounded-md border border-danger/40 px-4 py-2.5 text-sm text-danger hover:bg-red-50 disabled:opacity-50"
          onClick={() => {
            if (!confirm("Xóa TẤT CẢ từ vựng trong ứng dụng? Hành động không hoàn tác.")) {
              return;
            }
            if (!confirm("Xác nhận lần nữa: xóa hết mọi thẻ?")) return;
            setRows([]);
            startTransition(async () => {
              await deleteAllCards();
            });
          }}
        >
          Xóa tất cả
        </button>
      </div>

      <p className="text-xs text-muted">
        Hiển thị {cards.length}/{rows.length} thẻ
      </p>

      <ul className="space-y-2 md:hidden">
        {cards.map((card) =>
          editing === card.id ? (
            <li key={card.id} className="rounded-xl border border-line bg-card p-3">
              <EditForm
                card={card}
                topics={topics}
                pending={pending}
                onCancel={() => setEditing(null)}
                onSave={(data) => {
                  applyLocalUpdate(data);
                  setEditing(null);
                  startTransition(async () => {
                    await updateCard(data);
                  });
                }}
              />
            </li>
          ) : (
            <SwipeCardRow
              key={card.id}
              card={card}
              onEdit={() => setEditing(card.id)}
              onDelete={() => {
                if (confirm("Xóa thẻ này?")) {
                  haptic(20);
                  removeLocal(card.id);
                  startTransition(async () => {
                    await deleteCard(card.id);
                  });
                }
              }}
            />
          ),
        )}
        {cards.length === 0 && (
          <li className="rounded-xl border border-dashed border-line p-8 text-center text-muted">
            Không có thẻ nào.
          </li>
        )}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-line bg-card md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-bg-accent/60 text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Việt</th>
              <th className="px-3 py-2 font-medium">Hàn</th>
              <th className="px-3 py-2 font-medium">Chủ đề</th>
              <th className="px-3 py-2 font-medium">SRS</th>
              <th className="px-3 py-2 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id} className="border-b border-line/70 align-top">
                {editing === card.id ? (
                  <td className="px-3 py-2" colSpan={5}>
                    <EditForm
                      card={card}
                      topics={topics}
                      pending={pending}
                      onCancel={() => setEditing(null)}
                      onSave={(data) => {
                        applyLocalUpdate(data);
                        setEditing(null);
                        startTransition(async () => {
                          await updateCard(data);
                        });
                      }}
                    />
                  </td>
                ) : (
                  <>
                    <td className="px-3 py-2">{card.vi}</td>
                    <td className="ko px-3 py-2">{card.ko}</td>
                    <td className="px-3 py-2 text-muted">{card.topic.name}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                        {card.review?.status ?? "new"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-accent hover:underline"
                          onClick={() => setEditing(card.id)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="text-danger hover:underline"
                          onClick={() => {
                            if (confirm("Xóa thẻ này?")) {
                              removeLocal(card.id);
                              startTransition(async () => {
                                await deleteCard(card.id);
                              });
                            }
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {cards.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  Không có thẻ nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SwipeCardRow({
  card,
  onEdit,
  onDelete,
}: {
  card: CardRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const start = useRef<{ x: number; y: number; base: number } | null>(null);
  const axis = useRef<"h" | "v" | null>(null);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  offsetRef.current = offset;
  const open = offset < -56;

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      start.current = {
        x: t.clientX,
        y: t.clientY,
        base: offsetRef.current < -56 ? -128 : 0,
      };
      axis.current = null;
    };

    const onMove = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      if (!axis.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis.current = Math.abs(dx) > Math.abs(dy) * 1.15 ? "h" : "v";
      }
      if (axis.current !== "h") return;
      e.preventDefault();
      setOffset(Math.max(Math.min(start.current.base + dx, 0), -128));
    };

    const onEnd = () => {
      const wasH = axis.current === "h";
      start.current = null;
      axis.current = null;
      if (!wasH) return;
      setOffset((o) => {
        const next = o < -64 ? -128 : 0;
        if (next === -128) haptic(8);
        return next;
      });
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
  }, []);

  return (
    <li className="relative overflow-hidden overscroll-x-none rounded-xl border border-line bg-card">
      <div className="absolute inset-y-0 right-0 flex">
        <button
          type="button"
          onClick={onEdit}
          className="flex w-16 items-center justify-center bg-accent text-sm font-medium text-white"
        >
          Sửa
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex w-16 items-center justify-center bg-danger text-sm font-medium text-white"
        >
          Xóa
        </button>
      </div>
      <div
        ref={surfaceRef}
        className="relative touch-pan-y bg-card px-4 py-3 will-change-transform"
        style={{
          transform: `translate3d(${Math.max(Math.min(offset, 0), -128)}px,0,0)`,
          transition: start.current ? "none" : "transform 0.18s ease-out",
        }}
        onClick={() => {
          if (open) setOffset(0);
          else onEdit();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">{card.vi}</p>
            <p className="ko mt-0.5 text-lg text-ink">{card.ko}</p>
            <p className="mt-1 text-xs text-muted">
              {card.topic.name}
              {card.note ? ` · ${card.note}` : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
            {card.review?.status ?? "new"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-muted">Vuốt trái: Sửa / Xóa</p>
      </div>
    </li>
  );
}

function EditForm({
  card,
  topics,
  pending,
  onCancel,
  onSave,
}: {
  card: CardRow;
  topics: Topic[];
  pending: boolean;
  onCancel: () => void;
  onSave: (data: { id: string; topicId: string; vi: string; ko: string; note?: string }) => void;
}) {
  const [vi, setVi] = useState(card.vi);
  const [ko, setKo] = useState(card.ko);
  const [note, setNote] = useState(card.note ?? "");
  const [topicId, setTopicId] = useState(card.topicId);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input
        value={vi}
        onChange={(e) => setVi(e.target.value)}
        className="rounded-md border border-line px-3 py-2.5 text-base md:text-sm"
        placeholder="Việt"
      />
      <input
        value={ko}
        onChange={(e) => setKo(e.target.value)}
        className="ko rounded-md border border-line px-3 py-2.5 text-base md:text-sm"
        placeholder="Hàn"
      />
      <select
        value={topicId}
        onChange={(e) => setTopicId(e.target.value)}
        className="rounded-md border border-line px-3 py-2.5 text-base md:text-sm"
      >
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ghi chú"
        className="rounded-md border border-line px-3 py-2.5 text-base md:text-sm"
      />
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="button"
          disabled={pending}
          className="min-h-11 rounded-md bg-accent px-4 py-2 text-white"
          onClick={() => onSave({ id: card.id, topicId, vi, ko, note })}
        >
          Lưu
        </button>
        <button
          type="button"
          className="min-h-11 rounded-md border border-line px-4 py-2"
          onClick={onCancel}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
