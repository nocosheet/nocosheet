export function toSlug(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return /^[0-9]/.test(slug) ? `_${slug}` : slug;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const KEY_LENGTH = 10;

function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(KEY_LENGTH));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export const newKey = (prefix: "t" | "c" | "v") => `${prefix}_${randomKey()}`;

export const newTableName = () => newKey("t");
export const newColumnName = () => newKey("c");

export const physicalTableName = (workspace: string, tableName: string) =>
  `${workspace}__${tableName}`;

export const quoteIdent = (name: string) => `"${name.replaceAll('"', '""')}"`;
