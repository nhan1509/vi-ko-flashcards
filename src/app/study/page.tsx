import { getStudyCards, listTopics } from "@/lib/actions";
import { StudySession } from "@/components/StudySession";

export const dynamic = "force-dynamic";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; due?: string; dir?: string; r?: string }>;
}) {
  const params = await searchParams;
  const onlyDue = params.due !== "0";
  const direction = params.dir === "vi-ko" ? "vi-ko" : "ko-vi";
  const sessionKey = `${params.topic ?? "all"}-${onlyDue ? "due" : "all"}-${params.r ?? "0"}`;

  const [cards, topics] = await Promise.all([
    getStudyCards({
      topicId: params.topic,
      onlyDue,
      shuffle: true,
    }),
    listTopics(),
  ]);

  return (
    <StudySession
      key={sessionKey}
      cards={cards}
      topics={topics}
      initialTopicId={params.topic}
      initialOnlyDue={onlyDue}
      initialDirection={direction}
    />
  );
}
