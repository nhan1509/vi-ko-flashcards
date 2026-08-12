import { listTopics } from "@/lib/actions";
import { TopicManager } from "@/components/TopicManager";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const topics = await listTopics();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Chủ đề</h1>
        <p className="mt-1 text-muted">Tạo, đổi tên hoặc xóa nhóm từ vựng.</p>
      </div>
      <TopicManager topics={topics} />
    </div>
  );
}
