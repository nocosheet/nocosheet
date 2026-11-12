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

export const newTableName = () => randomKey();
export const newColumnName = () => `c_${randomKey()}`;

export const physicalTableName = (workspace: string, tableName: string) =>
  `${workspace}__t_${tableName}`;

export const quoteIdent = (name: string) => `"${name.replaceAll('"', '""')}"`;
