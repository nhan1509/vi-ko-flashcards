"use client";

import { useRef, useState, useTransition } from "react";
import { parseCsvOrTsv, parseExcelBuffer, type ImportRow } from "@/lib/import-parse";
import { importCards } from "@/lib/actions";

type Notice = { type: "success" | "error" | "info"; text: string };

export function ImportForm() {
  const [text, setText] = useState(
    "vi,ko,topic,note\nxin chào,안녕하세요,Chào hỏi,\ncảm ơn,감사합니다,Chào hỏi,lịch sự",
  );
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function runParseText() {
    try {
      const result = parseCsvOrTsv(text);
      setPreview(result.rows);
      setErrors(result.errors);
      if (result.rows.length === 0) {
        setNotice({
          type: "error",
          text: result.errors[0] ?? "Không đọc được dòng hợp lệ từ nội dung đã dán.",
        });
      } else {
        setNotice({
          type: "info",
          text: `Xem trước ${result.rows.length} thẻ${result.errors.length ? ` · ${result.errors.length} cảnh báo` : ""}. Bấm Import để lưu.`,
        });
      }
    } catch (err) {
      setPreview([]);
      setErrors([]);
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Phân tích CSV thất bại.",
      });
    }
  }

  async function onExcel(file: File) {
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelBuffer(buffer);
      setPreview(result.rows);
      setErrors(result.errors);
      if (result.rows.length === 0) {
        setNotice({
          type: "error",
          text: `File “${file.name}” không có dòng hợp lệ.${result.errors[0] ? ` ${result.errors[0]}` : ""}`,
        });
      } else {
        setNotice({
          type: "info",
          text: `Đã đọc “${file.name}”: ${result.rows.length} thẻ sẵn sàng import.`,
        });
      }
    } catch (err) {
      setPreview([]);
      setErrors([]);
      setNotice({
        type: "error",
        text: err instanceof Error ? `Không đọc được Excel: ${err.message}` : "Đọc Excel thất bại.",
      });
    }
  }

  async function onCsvFile(file: File) {
    try {
      const content = await file.text();
      setText(content);
      const result = parseCsvOrTsv(content);
      setPreview(result.rows);
      setErrors(result.errors);
      if (result.rows.length === 0) {
        setNotice({
          type: "error",
          text: `File “${file.name}” không có dòng hợp lệ.${result.errors[0] ? ` ${result.errors[0]}` : ""}`,
        });
      } else {
        setNotice({
          type: "info",
          text: `Đã đọc “${file.name}”: ${result.rows.length} thẻ sẵn sàng import.`,
        });
      }
    } catch (err) {
      setPreview([]);
      setErrors([]);
      setNotice({
        type: "error",
        text: err instanceof Error ? `Không đọc được CSV: ${err.message}` : "Đọc CSV thất bại.",
      });
    }
  }

  function onImport() {
    if (preview.length === 0) {
      setNotice({ type: "error", text: "Chưa có dữ liệu để import. Hãy xem trước hoặc chọn file." });
      return;
    }
    const count = preview.length;
    startTransition(async () => {
      try {
        const { created } = await importCards(preview);
        setPreview([]);
        setErrors([]);
        setNotice({
          type: "success",
          text: `Import thành công: đã thêm ${created}/${count} thẻ.`,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        setNotice({
          type: "error",
          text:
            err instanceof Error
              ? `Import thất bại: ${err.message}`
              : "Import thất bại. Thử lại sau.",
        });
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-card p-4 text-sm text-muted">
        <p className="font-medium text-ink">Định dạng cột</p>
        <p className="mt-1">
          <code>vi,ko,topic,note</code> — CSV hoặc dán từ Google Sheets (tab). Excel dùng cùng tên cột ở
          sheet đầu.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-good/30 bg-green-50 text-good"
              : notice.type === "error"
                ? "border-danger/30 bg-red-50 text-danger"
                : "border-accent/30 bg-accent-soft text-ink"
          }`}
        >
          <p className="font-medium">
            {notice.type === "success"
              ? "Hoàn thành"
              : notice.type === "error"
                ? "Thất bại"
                : "Thông báo"}
          </p>
          <p className="mt-1">{notice.text}</p>
        </div>
      )}

      <label className="block space-y-2 text-sm">
        <span>Dán CSV / TSV</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full rounded-md border border-line bg-card px-3 py-2 font-mono text-xs outline-none ring-accent focus:ring-2"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runParseText}
          className="min-h-11 rounded-md border border-line bg-card px-4 py-2 text-sm hover:bg-accent-soft"
        >
          Xem trước
        </button>
        <label className="flex min-h-11 cursor-pointer items-center rounded-md border border-line bg-card px-4 py-2 text-sm hover:bg-accent-soft">
          Chọn Excel / CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.tsv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (!file) return;
              if (file.name.endsWith(".csv") || file.name.endsWith(".tsv")) {
                void onCsvFile(file);
              } else {
                void onExcel(file);
              }
            }}
          />
        </label>
        <button
          type="button"
          disabled={pending || preview.length === 0}
          onClick={onImport}
          className="min-h-11 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Đang import…" : `Import${preview.length > 0 ? ` (${preview.length})` : ""}`}
        </button>
      </div>

      {errors.length > 0 && (
        <ul className="rounded-md border border-warn/30 bg-orange-50 p-3 text-sm text-warn">
          {errors.slice(0, 8).map((err) => (
            <li key={err}>{err}</li>
          ))}
          {errors.length > 8 && <li>… và {errors.length - 8} lỗi khác</li>}
        </ul>
      )}

      {preview.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-bg-accent/50 text-muted">
              <tr>
                <th className="px-3 py-2">Việt</th>
                <th className="px-3 py-2">Hàn</th>
                <th className="px-3 py-2">Chủ đề</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 50).map((row, i) => (
                <tr key={`${row.vi}-${i}`} className="border-b border-line/60">
                  <td className="px-3 py-2">{row.vi}</td>
                  <td className="ko px-3 py-2">{row.ko}</td>
                  <td className="px-3 py-2">{row.topic}</td>
                  <td className="px-3 py-2 text-muted">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 50 && (
            <p className="px-3 py-2 text-xs text-muted">Hiển thị 50/{preview.length} dòng</p>
          )}
        </div>
      )}
    </div>
  );
}
