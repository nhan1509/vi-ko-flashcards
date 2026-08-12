import { listCards, listTopics } from "@/lib/actions";
import { CardsTable } from "@/components/CardsTable";

export const dynamic = "force-dynamic";

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [cards, topics] = await Promise.all([
    listCards({
      topicId: params.topic,
      status: params.status,
      search: params.q,
    }),
    listTopics(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Quản lý từ</h1>
        <p className="mt-1 text-muted">Sửa, xóa và lọc theo trạng thái SRS.</p>
      </div>
      <CardsTable
        cards={cards}
        topics={topics}
        initialTopicId={params.topic}
        initialStatus={params.status}
        initialSearch={params.q}
      />
    </div>
  );
}
