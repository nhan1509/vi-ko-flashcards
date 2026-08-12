"use client";

import { useState, useTransition } from "react";
import { parseCsvOrTsv, parseExcelBuffer, type ImportRow } from "@/lib/import-parse";
import { importCards } from "@/lib/actions";

export function ImportForm() {
  const [text, setText] = useState(
    "vi,ko,topic,note\nxin chào,안녕하세요,Chào hỏi,\ncảm ơn,감사합니다,Chào hỏi,lịch sự",
  );
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function runParseText() {
    const result = parseCsvOrTsv(text);
    setPreview(result.rows);
    setErrors(result.errors);
    setMessage("");
  }

  async function onExcel(file: File | null) {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const result = parseExcelBuffer(buffer);
    setPreview(result.rows);
    setErrors(result.errors);
    setMessage(`Đã đọc ${file.name}`);
  }

  function onImport() {
    if (preview.length === 0) return;
    startTransition(async () => {
      const { created } = await importCards(preview);
      setMessage(`Đã import ${created} thẻ`);
      setPreview([]);
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
          className="rounded-md border border-line bg-card px-4 py-2 text-sm hover:bg-accent-soft"
        >
          Xem trước
        </button>
        <label className="cursor-pointer rounded-md border border-line bg-card px-4 py-2 text-sm hover:bg-accent-soft">
          Chọn Excel / CSV
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.tsv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (!file) return;
              if (file.name.endsWith(".csv") || file.name.endsWith(".tsv")) {
                file.text().then((content) => {
                  setText(content);
                  const result = parseCsvOrTsv(content);
                  setPreview(result.rows);
                  setErrors(result.errors);
                });
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
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Import {preview.length > 0 ? `(${preview.length})` : ""}
        </button>
      </div>

      {message && <p className="text-sm text-good">{message}</p>}
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
