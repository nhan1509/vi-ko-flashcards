import { ImportForm } from "@/components/ImportForm";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Import hàng loạt</h1>
        <p className="mt-1 text-muted">CSV, dán bảng, hoặc Excel (.xlsx).</p>
      </div>
      <ImportForm />
    </div>
  );
}
