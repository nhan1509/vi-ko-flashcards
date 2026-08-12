"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCard, updateCard } from "@/lib/actions";
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
  cards,
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
  const router = useRouter();
  const [topicId, setTopicId] = useState(initialTopicId ?? "");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushFilters(next?: { topicId?: string; status?: string; search?: string }) {
    const params = new URLSearchParams();
    const t = next?.topicId ?? topicId;
    const s = next?.status ?? status;
    const q = next?.search ?? search;
    if (t) params.set("topic", t);
    if (s) params.set("status", s);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/cards?${params.toString()}`);
  }

  function scheduleFilters(next: { topicId?: string; status?: string; search?: string }) {
    if (filterTimer.current) clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => pushFilters(next), 320);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-card p-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 text-sm">
          <span>Chủ đề</span>
          <select
            value={topicId}
            onChange={(e) => {
              const v = e.target.value;
              setTopicId(v);
              scheduleFilters({ topicId: v });
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
        <label className="flex-1 space-y-1 text-sm">
          <span>Trạng thái</span>
          <select
            value={status}
            onChange={(e) => {
              const v = e.target.value;
              setStatus(v);
              scheduleFilters({ status: v });
            }}
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
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);
              scheduleFilters({ search: v });
            }}
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
      </div>

      {/* Mobile list */}
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
                  startTransition(async () => {
                    await updateCard(data);
                    setEditing(null);
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

      {/* Desktop table */}
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
                        startTransition(async () => {
                          await updateCard(data);
                          setEditing(null);
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
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const open = offset < -56;

  return (
    <li className="relative overflow-hidden rounded-xl border border-line bg-card">
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
        className="relative bg-card px-4 py-3 transition-transform"
        style={{ transform: `translateX(${Math.max(Math.min(offset, 0), -128)}px)` }}
        onTouchStart={(e) => {
          startX.current = e.changedTouches[0].clientX;
        }}
        onTouchMove={(e) => {
          if (startX.current == null) return;
          setOffset(e.changedTouches[0].clientX - startX.current + (open ? -128 : 0));
        }}
        onTouchEnd={() => {
          startX.current = null;
          setOffset((o) => {
            const next = o < -64 ? -128 : 0;
            if (next === -128) haptic(8);
            return next;
          });
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
