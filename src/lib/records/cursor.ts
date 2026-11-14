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
  const values = cursor.slice(0, -1).map(encodeItem);
  return [...values, `${ID_PREFIX}${cursor.at(-1)}`].join(",");
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
    if (text.startsWith(ID_PREFIX, index)) {
      const raw = text.slice(index + ID_PREFIX.length);
      return /^[1-9]\d*$/.test(raw) ? [...items, Number(raw)] : null;
    }
    const read = readItem(text, index);
    if (!read) return null;
    const [item, next] = read;
    items.push(item);
    if (text[next] !== ",") return null;
    index = next + 1;
  }
  return null;
}
