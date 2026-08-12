import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ImportRow = {
  vi: string;
  ko: string;
  topic: string;
  note?: string;
};

export type ParseResult = {
  rows: ImportRow[];
  errors: string[];
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

function mapRecord(raw: Record<string, unknown>, index: number): { row?: ImportRow; error?: string } {
  const mapped: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    mapped[normalizeHeader(k)] = String(v ?? "").trim();
  }

  const vi = mapped.vi || mapped.vietnamese || mapped.viet || mapped.front || "";
  const ko = mapped.ko || mapped.korean || mapped.han || mapped.back || "";
  const topic = mapped.topic || mapped.chude || mapped.theme || mapped.category || "";
  const note = mapped.note || mapped.notes || mapped.ghichu || undefined;

  if (!vi && !ko) {
    return { error: `Dòng ${index + 1}: trống` };
  }
  if (!vi || !ko) {
    return { error: `Dòng ${index + 1}: thiếu vi hoặc ko` };
  }
  if (!topic) {
    return { error: `Dòng ${index + 1}: thiếu topic` };
  }

  return {
    row: {
      vi,
      ko,
      topic,
      note: note || undefined,
    },
  };
}

export function parseCsvOrTsv(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { rows: [], errors: ["Nội dung trống"] };

  const parsed = Papa.parse<Record<string, unknown>>(trimmed, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const rows: ImportRow[] = [];
  const errors: string[] = [...(parsed.errors.map((e) => e.message) || [])];

  parsed.data.forEach((record, i) => {
    const result = mapRecord(record, i);
    if (result.error) errors.push(result.error);
    if (result.row) rows.push(result.row);
  });

  return { rows, errors };
}

export function parseExcelBuffer(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [], errors: ["File Excel không có sheet"] };

  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const rows: ImportRow[] = [];
  const errors: string[] = [];

  json.forEach((record, i) => {
    const result = mapRecord(record, i);
    if (result.error) errors.push(result.error);
    if (result.row) rows.push(result.row);
  });

  return { rows, errors };
}
