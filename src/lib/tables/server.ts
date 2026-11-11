import { columnTable, resourceTable, tableTable } from "@db/schema";
import { HTTPException } from "hono/http-exception";
import {
  and,
  asc,
  count,
  db,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lt,
  notInArray,
  or,
  sql,
} from "void/db";

import { TRASH_RETENTION_DAYS } from "../records/retention";
import type { TrashQuery } from "../trash/query";
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

export async function findColumn(tableId: number, columnId: number) {
  const [row] = await db
    .select()
    .from(columnTable)
    .where(
      and(
        eq(columnTable.id, columnId),
        eq(columnTable.tableId, tableId),
        isNull(columnTable.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Column not found." });
  return row;
}

export const defined = <T extends object>(values: T) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };

export function conflictOrBadRequest(error: unknown, message: string): never {
  const detail = error instanceof Error ? error.message : String(error);
  if (/UNIQUE constraint failed|already exists|duplicate column name/i.test(detail))
    throw new HTTPException(409, { message });
  throw new HTTPException(400, { message: detail });
}

const linkTarget = sql`json_extract(${columnTable.options}, '$.tableId')`;

async function linkedFrom(ids: number[], liveOnly: boolean) {
  return db
    .select({ column: columnTable.name, table: tableTable.name })
    .from(columnTable)
    .innerJoin(tableTable, eq(columnTable.tableId, tableTable.id))
    .where(
      and(
        eq(columnTable.format, "relation"),
        isNull(columnTable.deletedAt),
        liveOnly ? isNull(tableTable.deletedAt) : undefined,
        notInArray(columnTable.tableId, ids),
        inArray(linkTarget, ids),
      ),
    );
}

async function dropTables(workspace: string, rows: { id: number; tableName: string }[]) {
  await db.batch([
    db.run(sql`pragma defer_foreign_keys = on`),
    ...rows.map((row) =>
      db.run(sql.raw(buildDropTable(physicalTableName(workspace, row.tableName)))),
    ),
    db.delete(resourceTable).where(
      inArray(
        resourceTable.id,
        rows.map((row) => row.id),
      ),
    ),
  ]);
}

export async function deleteTables(
  workspace: string,
  ids: number[],
  options: { userId: string; permanent?: boolean },
) {
  const unique = [...new Set(ids)];

  const rows = await db
    .select()
    .from(tableTable)
    .where(and(inArray(tableTable.id, unique), isNull(tableTable.deletedAt)));
  if (rows.length !== unique.length) throw new HTTPException(404, { message: "Table not found." });

  const [link] = await linkedFrom(unique, true);
  if (link)
    throw new HTTPException(409, {
      message: `"${link.table}" has a column "${link.column}" that links to a table you are deleting. Delete "${link.table}" first.`,
    });

  try {
    if (options.permanent) await dropTables(workspace, rows);
    else
      await db
        .update(tableTable)
        .set({ deletedAt: new Date(), deletedBy: options.userId })
        .where(inArray(tableTable.id, unique));
  } catch (error) {
    throw new HTTPException(409, {
      message: error instanceof Error ? error.message : "The tables could not be deleted.",
    });
  }
}

export async function listDeletedTables(query: TrashQuery) {
  const pattern = query.q ? `%${query.q.replaceAll(/[\\%_]/g, "\\$&")}%` : null;
  const where = and(
    isNotNull(tableTable.deletedAt),
    pattern
      ? or(
          sql`${tableTable.name} like ${pattern} escape '\\'`,
          sql`${tableTable.tableName} like ${pattern} escape '\\'`,
        )
      : undefined,
  );
  const sortExpression =
    query.sort === "name" ? sql`lower(${tableTable.name})` : tableTable.deletedAt;
  const direction = query.order === "desc" ? desc : asc;

  const [rows, [{ total }]] = await db.batch([
    db
      .select({
        id: tableTable.id,
        name: tableTable.name,
        tableName: tableTable.tableName,
        icon: tableTable.icon,
        deletedAt: tableTable.deletedAt,
        deletedBy: tableTable.deletedBy,
        deletedByName: sql<
          string | null
        >`(select u."name" from "user" u where u."id" = ${tableTable.deletedBy})`,
      })
      .from(tableTable)
      .where(where)
      .orderBy(direction(sortExpression), asc(tableTable.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ total: count() }).from(tableTable).where(where),
  ]);

  return {
    rows: rows.map(({ deletedBy, deletedByName, ...row }) => ({
      ...row,
      deletedAt: row.deletedAt?.getTime() ?? 0,
      deletedBy: deletedBy ? { id: deletedBy, label: deletedByName } : null,
    })),
    total,
  };
}

async function findDeletedTable(id: number) {
  const [row] = await db
    .select()
    .from(tableTable)
    .where(and(eq(tableTable.id, id), isNotNull(tableTable.deletedAt)))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "This table isn't in the trash." });
  return row;
}

export async function restoreTable(id: number) {
  const row = await findDeletedTable(id);

  const links = await db
    .select({ options: columnTable.options })
    .from(columnTable)
    .where(
      and(
        eq(columnTable.tableId, row.id),
        eq(columnTable.format, "relation"),
        isNull(columnTable.deletedAt),
      ),
    );
  const targets = [
    ...new Set(links.map((link) => Number((link.options as { tableId?: number }).tableId))),
  ].filter((target) => target !== row.id);
  if (targets.length > 0) {
    const [deleted] = await db
      .select({ name: tableTable.name })
      .from(tableTable)
      .where(and(inArray(tableTable.id, targets), isNotNull(tableTable.deletedAt)))
      .limit(1);
    if (deleted)
      throw new HTTPException(409, {
        message: `"${row.name}" links to "${deleted.name}", which is in the trash. Restore "${deleted.name}" first.`,
      });
  }

  try {
    await db
      .update(tableTable)
      .set({ deletedAt: null, deletedBy: null })
      .where(eq(tableTable.id, row.id));
  } catch (error) {
    conflictOrBadRequest(error, `A table named "${row.name}" already exists.`);
  }
  return { id: row.id };
}

export async function purgeDeletedTable(workspace: string, id: number) {
  const row = await findDeletedTable(id);
  const [link] = await linkedFrom([row.id], false);
  if (link)
    throw new HTTPException(409, {
      message: `"${link.table}" still links to this table. Delete "${link.table}" forever first.`,
    });
  await dropTables(workspace, [row]);
}

export async function purgeExpiredTables(workspace: string) {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let doomed = await db
    .select({ id: tableTable.id, tableName: tableTable.tableName })
    .from(tableTable)
    .where(and(isNotNull(tableTable.deletedAt), lt(tableTable.deletedAt, cutoff)));

  for (let blocked = true; blocked && doomed.length > 0;) {
    const ids = doomed.map((row) => row.id);
    const rows = await db
      .select({ target: linkTarget })
      .from(columnTable)
      .where(
        and(
          eq(columnTable.format, "relation"),
          isNull(columnTable.deletedAt),
          notInArray(columnTable.tableId, ids),
          inArray(linkTarget, ids),
        ),
      );
    const stuck = new Set(rows.map((row) => Number(row.target)));
    blocked = stuck.size > 0;
    doomed = doomed.filter((row) => !stuck.has(row.id));
  }

  if (doomed.length > 0) await dropTables(workspace, doomed);
  return doomed.length;
}
