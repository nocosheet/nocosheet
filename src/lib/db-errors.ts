export type DbErrorKind = "unique" | "exists" | "foreign_key" | "check" | "not_null" | "other";

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
  if (/already exists|duplicate column name/i.test(message)) return { kind: "exists", message };
  if (/FOREIGN KEY/i.test(message)) return { kind: "foreign_key", message };
  if (/CHECK constraint/i.test(message)) return { kind: "check", message };
  if (/NOT NULL constraint/i.test(message)) return { kind: "not_null", message };
  return { kind: "other", message: message || "The request could not be completed." };
}
