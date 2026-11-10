import { columnTable, resourceTable, tableTable } from "@db/schema";
import { HTTPException } from "hono/http-exception";
import { and, db, eq, inArray, isNull, notInArray, sql } from "void/db";

import { buildDropTable } from "./ddl";
import { physicalTableName } from "./naming";

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

export async function deleteTables(workspace: string, ids: number[]) {
  const unique = [...new Set(ids)];

  const rows = await db
    .select()
    .from(tableTable)
    .where(and(inArray(tableTable.id, unique), isNull(tableTable.deletedAt)));
  if (rows.length !== unique.length) throw new HTTPException(404, { message: "Table not found." });

  const [link] = await db
    .select({ column: columnTable.name, table: tableTable.name })
    .from(columnTable)
    .innerJoin(tableTable, eq(columnTable.tableId, tableTable.id))
    .where(
      and(
        eq(columnTable.format, "relation"),
        isNull(columnTable.deletedAt),
        isNull(tableTable.deletedAt),
        notInArray(columnTable.tableId, unique),
        inArray(sql`json_extract(${columnTable.options}, '$.tableId')`, unique),
      ),
    )
    .limit(1);
  if (link)
    throw new HTTPException(409, {
      message: `"${link.table}" has a column "${link.column}" that links to a table you are deleting.`,
    });

  try {
    await db.batch([
      db.run(sql`pragma defer_foreign_keys = on`),
      ...rows.map((row) =>
        db.run(sql.raw(buildDropTable(physicalTableName(workspace, row.tableName)))),
      ),
      db.delete(resourceTable).where(inArray(resourceTable.id, unique)),
    ]);
  } catch (error) {
    throw new HTTPException(409, {
      message: error instanceof Error ? error.message : "The tables could not be deleted.",
    });
  }
}
