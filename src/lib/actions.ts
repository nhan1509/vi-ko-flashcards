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
  revalidatePath("/study");
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
  revalidatePath("/study");
}

export async function deleteCard(id: string) {
  await prisma.card.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/cards");
  revalidatePath("/study");
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

  revalidatePath("/");
  revalidatePath("/study");
  revalidatePath("/cards");
  return next;
}

export async function importCards(rows: ImportRow[]) {
  let created = 0;
  const topicCache = new Map<string, string>();

  for (const row of rows) {
    const topicName = row.topic.trim();
    let topicId = topicCache.get(topicName);
    if (!topicId) {
      const topic = await prisma.topic.upsert({
        where: { name: topicName },
        create: { name: topicName },
        update: {},
      });
      topicId = topic.id;
      topicCache.set(topicName, topicId);
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

  revalidatePath("/");
  revalidatePath("/cards");
  revalidatePath("/topics");
  revalidatePath("/study");
  return { created };
}
