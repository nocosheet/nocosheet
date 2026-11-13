import { fromBase64Url, toBase64Url } from "./query";

export type RecordCursor = (string | number | null)[];

const isScalar = (item: unknown): item is string | number =>
  typeof item === "string" || typeof item === "number";

export const encodeCursor = (cursor: RecordCursor) => toBase64Url(JSON.stringify(cursor));

export function decodeCursor(text: string): RecordCursor | null {
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(text));
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 8) return null;
    return parsed.every((item) => item === null || isScalar(item)) ? parsed : null;
  } catch {
    return null;
  }
}
