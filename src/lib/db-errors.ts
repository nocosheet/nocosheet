export type DbErrorKind =
  | "unique"
  | "exists"
  | "foreign_key"
  | "check"
  | "not_null"
  | "dependency"
  | "reference"
  | "other";

export type DbError = { kind: DbErrorKind; message: string; column?: string };

export function classifyDbError(error: unknown): DbError {
  const message = [error, (error as { cause?: unknown })?.cause]
    .map((item) => (item instanceof Error ? item.message : ""))
    .join(" ")
    .trim();

  if (/UNIQUE constraint/i.test(message))
    return {
      kind: "unique",
      message,
      column: /UNIQUE constraint failed: ([\w.]+)/i.exec(message)?.[1]?.split(".").pop(),
    };
  if (/already exists|duplicate column name|already another table or index/i.test(message)) return { kind: "exists", message };
  const dependent = /after drop column: no such column: "?([\w$]+)"?/i.exec(message);
  if (dependent)
    return {
      kind: "dependency",
      message: "Another column's computed value or check uses this column.",
      column: dependent[1],
    };
  const reference = /after add column: no such column: "?([\w$]+)"?/i.exec(message);
  if (reference)
    return {
      kind: "reference",
      message: `"${reference[1]}" isn't a column of this table. Check the computed value and check expression.`,
      column: reference[1],
    };
  if (/FOREIGN KEY/i.test(message)) return { kind: "foreign_key", message };
  if (/CHECK constraint/i.test(message)) return { kind: "check", message };
  if (/NOT NULL constraint/i.test(message)) return { kind: "not_null", message };
  return { kind: "other", message: message || "The request could not be completed." };
}
