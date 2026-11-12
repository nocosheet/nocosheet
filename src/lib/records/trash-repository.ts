import { columnTable, tableTable, trashTable } from "@db/schema";
import { and, asc, count, db, desc, eq, inArray, isNull, lt, or, sql } from "void/db";

import { physicalTableName, quoteIdent } from "../tables/naming";
import type { Column, Table } from "../tables/repository";
import type { TrashQuery } from "../trash/query";
import { insertRecord, recordsTable } from "./repository";
import type { ParsedValue } from "./values";

export type Row = Record<string, unknown>;
export type Snapshot = { table: Table; rows: Row[] };

const CHUNK = 50;
const INSERT_CHUNK = 15;

const raw = (text: string) => sql.raw(text);
const physical = (workspace: string, table: Table) =>
  raw(quoteIdent(physicalTableName(workspace, table.tableName)));
const idList = (ids: unknown[]) =>
  sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
const chunks = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

export const isStorableColumn = (column: Column) =>
  !column.isGenerated && column.format !== "binary";

export async function findRows(workspace: string, table: Table, columns: Column[], ids: unknown[]) {
  const names = raw(
    [
      "id",
      "created_at",
      "updated_at",
      "created_by",
      "updated_by",
      ...columns.filter(isStorableColumn).map((column) => column.columnName),
    ]
      .map(quoteIdent)
      .join(", "),
  );
  const rows: Row[] = [];
  for (const part of chunks(ids, CHUNK))
    rows.push(
      ...(await db.all<Row>(
        sql`select ${names} from ${physical(workspace, table)} where "id" in (${idList(part)})`,
      )),
    );
  return rows;
}

export async function listReferencingColumns(tableId: number) {
  const rows = await db
    .select({ column: columnTable, table: tableTable })
    .from(columnTable)
    .innerJoin(tableTable, eq(tableTable.id, columnTable.tableId))
    .where(and(eq(columnTable.format, "relation"), isNull(columnTable.deletedAt)));
  return rows.filter(
    ({ column }) => Number((column.options as { tableId?: number }).tableId) === tableId,
  );
}

export async function findLinkedIds(
  workspace: string,
  source: Table,
  column: Column,
  ids: unknown[],
) {
  const linked: unknown[] = [];
  for (const part of chunks(ids, CHUNK))
    linked.push(
      ...(
        await db.all<{ id: unknown }>(
          sql`select "id" from ${physical(workspace, source)} where ${raw(quoteIdent(column.columnName))} in (${idList(part)})`,
        )
      ).map((row) => row.id),
    );
  return linked;
}

export async function trashAndDeleteRows(
  workspace: string,
  table: Table,
  snapshots: Snapshot[],
  topIds: unknown[],
  userId: string,
) {
  const entries = snapshots.flatMap(({ table: owner, rows }) =>
    rows.map((row) => ({
      tableId: owner.id,
      recordId: String(row.id),
      data: row,
      deletedBy: userId,
    })),
  );
  const inserts = chunks(entries, INSERT_CHUNK).map((part) =>
    db
      .insert(trashTable)
      .values(part)
      .returning({ id: trashTable.id, tableId: trashTable.tableId }),
  );
  const source = recordsTable(workspace, table);
  const removals = chunks(topIds, CHUNK).map((part) =>
    db.delete(source).where(inArray(source.id, part as string[])),
  );

  const results = (await db.batch([...inserts, ...removals] as never)) as unknown[];
  return (results.slice(0, inserts.length) as { id: number; tableId: number }[][])
    .flat()
    .filter((entry) => entry.tableId === table.id)
    .map((entry) => entry.id);
}

export async function listTrash(table: Table, query: TrashQuery) {
  const [title] = table.titleColumnId
    ? await db
        .select({ columnName: columnTable.columnName })
        .from(columnTable)
        .where(and(eq(columnTable.id, table.titleColumnId), isNull(columnTable.deletedAt)))
        .limit(1)
    : [];

  const titleText = title
    ? sql<
        string | null
      >`cast(json_extract(${trashTable.data}, ${`$."${title.columnName}"`}) as text)`
    : sql<string | null>`null`;
  const pattern = query.q ? `%${query.q.replaceAll(/[\\%_]/g, "\\$&")}%` : null;
  const where = and(
    eq(trashTable.tableId, table.id),
    pattern
      ? or(
          sql`${titleText} like ${pattern} escape '\\'`,
          sql`${trashTable.recordId} like ${pattern} escape '\\'`,
        )
      : undefined,
  );
  const sortExpression = query.sort === "name" ? sql`lower(${titleText})` : trashTable.deletedAt;
  const direction = query.order === "desc" ? desc : asc;

  const [rows, [{ total }]] = await db.batch([
    db
      .select({
        id: trashTable.id,
        recordId: trashTable.recordId,
        title: titleText,
        deletedAt: trashTable.deletedAt,
        deletedBy: trashTable.deletedBy,
        deletedByName: sql<
          string | null
        >`(select u."name" from "user" u where u."id" = ${trashTable.deletedBy})`,
      })
      .from(trashTable)
      .where(where)
      .orderBy(direction(sortExpression), asc(trashTable.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ total: count() }).from(trashTable).where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      recordId: row.recordId,
      title: row.title,
      deletedAt: row.deletedAt.getTime(),
      deletedBy: row.deletedBy ? { id: row.deletedBy, label: row.deletedByName } : null,
    })),
    total,
  };
}

export async function findTrashEntry(table: Table, entryId: number) {
  const [entry] = await db
    .select()
    .from(trashTable)
    .where(and(eq(trashTable.id, entryId), eq(trashTable.tableId, table.id)))
    .limit(1);
  return entry;
}

export async function findSnapshotLabels(workspace: string, columns: Column[], row: Row) {
  const labels: Row = {};

  for (const column of columns) {
    const value = row[column.columnName];
    if (column.format !== "relation" || value === null || value === undefined) continue;
    const [target] = await db
      .select({ tableName: tableTable.tableName, title: columnTable.columnName })
      .from(tableTable)
      .leftJoin(columnTable, eq(columnTable.id, tableTable.titleColumnId))
      .where(
        and(
          eq(tableTable.id, Number((column.options as { tableId?: number }).tableId)),
          isNull(tableTable.deletedAt),
        ),
      )
      .limit(1);
    if (!target) continue;
    const [found] = await db.all<{ label: string | null }>(
      sql`select cast(${raw(quoteIdent(target.title ?? "id"))} as text) as label from ${raw(quoteIdent(physicalTableName(workspace, target.tableName)))} where "id" = ${value} limit 1`,
    );
    if (found) labels[`${column.columnName}__label`] = found.label;
  }

  for (const key of ["created_by", "updated_by"]) {
    if (!row[key]) continue;
    const [user] = await db.all<{ name: string }>(
      sql`select "name" from "user" where "id" = ${row[key]} limit 1`,
    );
    if (user) labels[`${key}__label`] = user.name;
  }

  return labels;
}

export async function findExistingUserIds(ids: string[]) {
  if (ids.length === 0) return new Set<string>();
  const rows = await db.all<{ id: string }>(
    sql`select "id" from "user" where "id" in (${idList(ids)})`,
  );
  return new Set(rows.map((row) => row.id));
}

export async function restoreRow(
  workspace: string,
  table: Table,
  entryId: number,
  parsed: ParsedValue<Column>[],
  system: Record<string, unknown>,
) {
  await db.batch([
    insertRecord(workspace, table, parsed, system),
    db.delete(trashTable).where(eq(trashTable.id, entryId)),
  ]);
}

export async function purgeTrashEntry(table: Table, entryId: number) {
  const removed = await db
    .delete(trashTable)
    .where(and(eq(trashTable.id, entryId), eq(trashTable.tableId, table.id)))
    .returning({ id: trashTable.id });
  return removed.length > 0;
}

export async function purgeExpiredTrashEntries(cutoff: Date) {
  const removed = await db
    .delete(trashTable)
    .where(lt(trashTable.deletedAt, cutoff))
    .returning({ id: trashTable.id });
  return removed.length;
}
