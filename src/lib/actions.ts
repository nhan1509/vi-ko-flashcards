"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { applySrs, defaultReviewState, type SrsGrade } from "@/lib/srs";
import type { ImportRow } from "@/lib/import-parse";

export async function getDashboardStats() {
  const now = new Date();
  const [topics, cards, due, known, learning, hard, news] = await Promise.all([
    prisma.topic.count(),
    prisma.card.count(),
    prisma.reviewState.count({ where: { dueAt: { lte: now } } }),
    prisma.reviewState.count({ where: { status: "known" } }),
    prisma.reviewState.count({ where: { status: "learning" } }),
    prisma.reviewState.count({ where: { status: "hard" } }),
    prisma.reviewState.count({ where: { status: "new" } }),
  ]);
  return { topics, cards, due, known, learning, hard, news };
}

export async function listTopics() {
  return prisma.topic.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { cards: true } } },
  });
}

export async function createTopic(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tên chủ đề không được trống");
  await prisma.topic.create({ data: { name: trimmed } });
  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/cards");
}

export async function renameTopic(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tên chủ đề không được trống");
  await prisma.topic.update({ where: { id }, data: { name: trimmed } });
  revalidatePath("/");
  revalidatePath("/topics");
}

export async function deleteTopic(id: string) {
  await prisma.topic.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/cards");
}

export async function createCard(input: {
  topicId: string;
  vi: string;
  ko: string;
  note?: string;
}) {
  const vi = input.vi.trim();
  const ko = input.ko.trim();
  if (!vi || !ko) throw new Error("Cần nhập cả tiếng Việt và tiếng Hàn");
  if (!input.topicId) throw new Error("Chọn chủ đề");

  const review = defaultReviewState();
  await prisma.card.create({
    data: {
      vi,
      ko,
      note: input.note?.trim() || null,
      topicId: input.topicId,
      review: {
        create: {
          ease: review.ease,
          intervalDays: review.intervalDays,
          repetitions: review.repetitions,
          dueAt: review.dueAt,
          status: review.status,
        },
      },
    },
  });
  revalidatePath("/");
  revalidatePath("/cards");
}

export async function updateCard(input: {
  id: string;
  topicId: string;
  vi: string;
  ko: string;
  note?: string;
}) {
  await prisma.card.update({
    where: { id: input.id },
    data: {
      vi: input.vi.trim(),
      ko: input.ko.trim(),
      note: input.note?.trim() || null,
      topicId: input.topicId,
    },
  });
  revalidatePath("/cards");
}

export async function deleteCard(id: string) {
  await prisma.card.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/cards");
}

export async function deleteAllCards() {
  const result = await prisma.card.deleteMany();
  revalidatePath("/");
  revalidatePath("/cards");
  revalidatePath("/study");
  revalidatePath("/topics");
  return { deleted: result.count };
}

export async function listCards(filters?: {
  topicId?: string;
  status?: string;
  search?: string;
}) {
  return prisma.card.findMany({
    where: {
      ...(filters?.topicId ? { topicId: filters.topicId } : {}),
      ...(filters?.status ? { review: { status: filters.status } } : {}),
      ...(filters?.search
        ? {
            OR: [
              { vi: { contains: filters.search } },
              { ko: { contains: filters.search } },
              { note: { contains: filters.search } },
            ],
          }
        : {}),
    },
    include: { topic: true, review: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudyCards(options: {
  topicId?: string;
  onlyDue?: boolean;
  shuffle?: boolean;
}) {
  const now = new Date();
  const cards = await prisma.card.findMany({
    where: {
      ...(options.topicId ? { topicId: options.topicId } : {}),
      ...(options.onlyDue !== false
        ? { review: { dueAt: { lte: now } } }
        : {}),
    },
    include: { topic: true, review: true },
  });

  if (options.shuffle !== false) {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  return cards;
}

export async function reviewCard(cardId: string, grade: SrsGrade) {
  const existing = await prisma.reviewState.findUnique({ where: { cardId } });
  const current = existing
    ? {
        ease: existing.ease,
        intervalDays: existing.intervalDays,
        repetitions: existing.repetitions,
        dueAt: existing.dueAt,
        status: existing.status as "new" | "learning" | "known" | "hard",
      }
    : defaultReviewState();

  const next = applySrs(current, grade);

  await prisma.reviewState.upsert({
    where: { cardId },
    create: {
      cardId,
      ease: next.ease,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      dueAt: next.dueAt,
      status: next.status,
    },
    update: {
      ease: next.ease,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      dueAt: next.dueAt,
      status: next.status,
    },
  });

  // Skip revalidatePath here — study UI is client-owned; avoids RSC refetch lag per grade.
  return next;
}

/** Call when leaving a study session so dashboard counts refresh. */
export async function revalidateStudyRelated() {
  revalidatePath("/");
  revalidatePath("/cards");
}

export async function importCards(
  rows: ImportRow[],
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  if (!rows.length) {
    return { ok: false, error: "Không có dòng nào để import." };
  }

  try {
    const topicCache = new Map<string, string>();
    const uniqueTopics = [
      ...new Set(rows.map((r) => r.topic.trim()).filter(Boolean)),
    ];

    if (uniqueTopics.length === 0) {
      return { ok: false, error: "Thiếu cột topic. Mỗi dòng cần có chủ đề." };
    }

    for (const topicName of uniqueTopics) {
      const topic = await prisma.topic.upsert({
        where: { name: topicName },
        create: { name: topicName },
        update: {},
      });
      topicCache.set(topicName, topic.id);
    }

    let created = 0;

    // Avoid interactive $transaction — not reliable with Turso/libsql adapter on Vercel.
    for (const row of rows) {
      const topicId = topicCache.get(row.topic.trim());
      if (!topicId) {
        return {
          ok: false,
          error: `Thiếu chủ đề cho thẻ “${row.vi}”. Đã lưu ${created} thẻ trước đó.`,
        };
      }

      const review = defaultReviewState();
      await prisma.card.create({
        data: {
          vi: row.vi.trim(),
          ko: row.ko.trim(),
          note: row.note?.trim() || null,
          topicId,
          review: {
            create: {
              ease: review.ease,
              intervalDays: review.intervalDays,
              repetitions: review.repetitions,
              dueAt: review.dueAt,
              status: review.status,
            },
          },
        },
      });
      created += 1;
    }

    try {
      revalidatePath("/");
      revalidatePath("/cards");
      revalidatePath("/topics");
      revalidatePath("/study");
    } catch (revalidateErr) {
      console.error("[importCards] revalidate failed", revalidateErr);
    }
    return { ok: true, created };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Lỗi không xác định khi ghi database.";
    console.error("[importCards]", err);
    return {
      ok: false,
      error: message.includes("Server Components")
        ? "Không ghi được database (Turso). Kiểm tra DATABASE_URL / TURSO_AUTH_TOKEN trên Vercel."
        : message,
    };
  }
}
