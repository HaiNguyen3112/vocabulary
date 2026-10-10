import { parseWordRows, type ParsedWordRows } from "@/lib/excel-rows";

/** Reads the first sheet of an Excel/CSV file into validated word rows. */
export async function readWordsFromExcel(file: File): Promise<ParsedWordRows> {
  // xlsx is large — load it only when a file is actually picked.
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { valid: [], invalid: [] };
  return parseWordRows(XLSX.utils.sheet_to_json(sheet, { defval: "" }));
}
