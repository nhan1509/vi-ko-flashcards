"use client";

import { FormEvent, useState, useTransition } from "react";
import { createCard } from "@/lib/actions";

type Topic = { id: string; name: string };

export function AddCardForm({ topics }: { topics: Topic[] }) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [vi, setVi] = useState("");
  const [ko, setKo] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save(keepGoing: boolean) {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        await createCard({ topicId, vi, ko, note });
        setMessage("Đã lưu thẻ");
        setVi("");
        setKo("");
        setNote("");
        if (!keepGoing) {
          // stay on page either way; focus for next
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi lưu thẻ");
      }
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save(true);
  }

  if (topics.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-card p-6 text-sm text-muted">
        Hãy tạo ít nhất một chủ đề trước khi thêm từ.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-2xl border border-line bg-card p-5">
      <label className="block space-y-1 text-sm">
        <span>Chủ đề</span>
        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 outline-none ring-accent focus:ring-2"
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span>Tiếng Việt</span>
        <input
          value={vi}
          onChange={(e) => setVi(e.target.value)}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 outline-none ring-accent focus:ring-2"
          required
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="ko">한국어</span>
        <input
          value={ko}
          onChange={(e) => setKo(e.target.value)}
          className="ko w-full rounded-md border border-line bg-bg px-3 py-2 outline-none ring-accent focus:ring-2"
          required
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Ghi chú (tuỳ chọn)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 outline-none ring-accent focus:ring-2"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-good">{message}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Lưu & thêm tiếp
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => save(false)}
          className="rounded-md border border-line px-4 py-2 text-sm hover:bg-accent-soft disabled:opacity-60"
        >
          Chỉ lưu
        </button>
      </div>
    </form>
  );
}
