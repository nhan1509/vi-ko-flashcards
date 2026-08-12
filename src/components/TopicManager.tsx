"use client";

import { FormEvent, useState, useTransition } from "react";
import { createTopic, deleteTopic, renameTopic } from "@/lib/actions";

type Topic = {
  id: string;
  name: string;
  _count: { cards: number };
};

export function TopicManager({ topics }: { topics: Topic[] }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await createTopic(name);
        setName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên chủ đề mới"
          className="flex-1 rounded-md border border-line bg-card px-3 py-2 outline-none ring-accent focus:ring-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Tạo chủ đề
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}

      <ul className="space-y-2">
        {topics.map((topic) => (
          <li
            key={topic.id}
            className="flex flex-col gap-2 rounded-xl border border-line bg-card p-3 sm:flex-row sm:items-center"
          >
            <input
              defaultValue={topic.name}
              className="flex-1 rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next && next !== topic.name) {
                  startTransition(async () => {
                    await renameTopic(topic.id, next);
                  });
                }
              }}
            />
            <span className="text-sm text-muted">{topic._count.cards} từ</span>
            <button
              type="button"
              className="rounded-md border border-line px-3 py-1.5 text-sm text-danger hover:bg-red-50"
              onClick={() => {
                if (confirm(`Xóa chủ đề "${topic.name}" và toàn bộ thẻ?`)) {
                  startTransition(async () => {
                    await deleteTopic(topic.id);
                  });
                }
              }}
            >
              Xóa
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
