export type RecordCursor = (string | number | null)[];

const ID_PREFIX = "id:";
const NUMERIC = /^-?\d+(\.\d+)?$/;
const MAX_ITEMS = 8;

function encodeItem(item: string | number | null) {
  if (item === null) return "null";
  if (typeof item === "number") return String(item);
  const bare = item !== "" && !/[,"]|^\s|\s$/.test(item) && item !== "null" && !NUMERIC.test(item);
  return bare ? item : `"${item.replaceAll('"', '""')}"`;
}

export const encodeCursor = (cursor: RecordCursor) => {
  const id = cursor.at(-1) ?? null;
  const values = cursor.slice(0, -1).map(encodeItem);
  return [...values, `${ID_PREFIX}${encodeItem(id)}`].join(",");
};

function readItem(text: string, start: number): [string | number | null, number] | null {
  if (text[start] === '"') {
    let value = "";
    let index = start + 1;
    while (index < text.length) {
      if (text[index] === '"') {
        if (text[index + 1] !== '"') return [value, index + 1];
        value += '"';
        index += 2;
      } else value += text[index++];
    }
    return null;
  }
  const end = text.indexOf(",", start);
  const raw = text.slice(start, end === -1 ? text.length : end);
  const next = end === -1 ? text.length : end;
  if (raw === "null") return [null, next];
  return [NUMERIC.test(raw) ? Number(raw) : raw, next];
}

export function decodeCursor(text: string): RecordCursor | null {
  const items: RecordCursor = [];
  let index = 0;
  while (index <= text.length && items.length < MAX_ITEMS) {
    const isId = text.startsWith(ID_PREFIX, index);
    const read = readItem(text, isId ? index + ID_PREFIX.length : index);
    if (!read) return null;
    const [item, next] = read;
    items.push(item);
    if (isId) return next === text.length && item !== null ? items : null;
    if (text[next] !== ",") return null;
    index = next + 1;
  }
  return null;
}
