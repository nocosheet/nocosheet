import { tableTable } from "@db/schema";
import { HTTPException } from "hono/http-exception";
import { and, db, eq, isNull } from "void/db";

export async function findTable(id: number) {
  const [row] = await db
    .select()
    .from(tableTable)
    .where(and(eq(tableTable.id, id), isNull(tableTable.deletedAt)))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Table not found." });
  return row;
}

export function conflictOrBadRequest(error: unknown, message: string): never {
  const detail = error instanceof Error ? error.message : String(error);
  if (/UNIQUE constraint failed|already exists|duplicate column name/i.test(detail))
    throw new HTTPException(409, { message });
  throw new HTTPException(400, { message: detail });
}
