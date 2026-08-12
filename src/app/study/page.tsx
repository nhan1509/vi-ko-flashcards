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
  const sessionKey = `${params.topic ?? "all"}-${onlyDue ? "due" : "all"}-${direction}-${params.r ?? "0"}`;

  const [cards, topics] = await Promise.all([
    getStudyCards({
      topicId: params.topic,
      onlyDue,
      shuffle: true,
    }),
    listTopics(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Phiên học SRS</h1>
        <p className="mt-1 text-muted">
          Thẻ được xáo trộn. Chấm Again / Hard / Good / Easy để lên lịch ôn.
        </p>
      </div>
      <StudySession
        key={sessionKey}
        cards={cards}
        topics={topics}
        initialTopicId={params.topic}
        initialOnlyDue={onlyDue}
        initialDirection={direction}
      />
    </div>
  );
}
