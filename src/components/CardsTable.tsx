"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCard, updateCard } from "@/lib/actions";

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

  const filtered = useMemo(() => cards, [cards]);

  function applyFilters() {
    const params = new URLSearchParams();
    if (topicId) params.set("topic", topicId);
    if (status) params.set("status", status);
    if (search.trim()) params.set("q", search.trim());
    router.push(`/cards?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-card p-3 sm:flex-row sm:items-end">
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
        <label className="flex-1 space-y-1 text-sm">
          <span>Trạng thái</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-3 py-2"
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
            className="w-full rounded-md border border-line bg-bg px-3 py-2"
            placeholder="vi / ko / note"
          />
        </label>
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Lọc
        </button>
        <Link
          href="/cards/new"
          className="rounded-md border border-line px-4 py-2 text-center text-sm hover:bg-accent-soft"
        >
          Thêm từ
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
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
            {filtered.map((card) => (
              <tr key={card.id} className="border-b border-line/70 align-top">
                {editing === card.id ? (
                  <EditRow
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
            {filtered.length === 0 && (
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

function EditRow({
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
    <>
      <td className="px-3 py-2" colSpan={5}>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={vi}
            onChange={(e) => setVi(e.target.value)}
            className="rounded-md border border-line px-2 py-1.5"
          />
          <input
            value={ko}
            onChange={(e) => setKo(e.target.value)}
            className="ko rounded-md border border-line px-2 py-1.5"
          />
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="rounded-md border border-line px-2 py-1.5"
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
            className="rounded-md border border-line px-2 py-1.5"
          />
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={pending}
            className="rounded-md bg-accent px-3 py-1.5 text-white"
            onClick={() => onSave({ id: card.id, topicId, vi, ko, note })}
          >
            Lưu
          </button>
          <button type="button" className="rounded-md border border-line px-3 py-1.5" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </td>
    </>
  );
}
