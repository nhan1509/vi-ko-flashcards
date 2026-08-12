import { listTopics } from "@/lib/actions";
import { AddCardForm } from "@/components/AddCardForm";

export const dynamic = "force-dynamic";

export default async function NewCardPage() {
  const topics = await listTopics();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Thêm từ thủ công</h1>
        <p className="mt-1 text-muted">Nhập từng thẻ Việt–Hàn theo chủ đề.</p>
      </div>
      <AddCardForm topics={topics} />
    </div>
  );
}
