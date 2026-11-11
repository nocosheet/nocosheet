import { columnTable, tableTable, trashTable } from "@db/schema";
import { and, asc, count, db, desc, eq, inArray, isNull, lt, or, sql } from "void/db";

import { physicalTableName, quoteIdent } from "../tables/naming";
import type { TrashQuery } from "../trash/query";
import { TRASH_RETENTION_DAYS } from "./retention";
import {
  activeColumns,
  apiError,
  assertLinksExist,
  assertRequired,
  insertRecord,
  recordsTable,
  parseValues,
  shapeRecord,
  writeError,
  type ParsedValue,
} from "./server";

type Table = typeof tableTable.$inferSelect;
type Column = typeof columnTable.$inferSelect;
type Row = Record<string, unknown>;
type Snapshot = { table: Table; rows: Row[] };

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
const storable = (column: Column) => !column.generatedExpression && column.format !== "binary";

async function selectRows(workspace: string, table: Table, columns: Column[], ids: unknown[]) {
  const names = raw(
    [
      "id",
      "created_at",
      "updated_at",
      "created_by",
      "updated_by",
      ...columns.filter(storable).map((column) => column.columnName),
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

async function referencingColumns(tableId: number) {
  const rows = await db
    .select({ column: columnTable, table: tableTable })
    .from(columnTable)
    .innerJoin(tableTable, eq(tableTable.id, columnTable.tableId))
    .where(and(eq(columnTable.format, "relation"), isNull(columnTable.deletedAt)));
  return rows.filter(
    ({ column }) => Number((column.options as { tableId?: number }).tableId) === tableId,
  );
}

async function collect(
  workspace: string,
  table: Table,
  ids: unknown[],
  out: Snapshot[],
  seen: Set<string>,
) {
  const fresh = ids.filter((id) => !seen.has(`${table.id}:${String(id)}`));
  fresh.forEach((id) => seen.add(`${table.id}:${String(id)}`));
  if (fresh.length === 0) return;

  const rows = await selectRows(workspace, table, await activeColumns(table), fresh);
  if (rows.length === 0) return;
  out.push({ table, rows });

  for (const { column, table: source } of await referencingColumns(table.id)) {
    if ((column.options as { onDelete?: string }).onDelete !== "cascade") continue;
    const linked: unknown[] = [];
    for (const part of chunks(
      rows.map((row) => row.id),
      CHUNK,
    ))
      linked.push(
        ...(
          await db.all<{ id: unknown }>(
            sql`select "id" from ${physical(workspace, source)} where ${raw(quoteIdent(column.columnName))} in (${idList(part)})`,
          )
        ).map((row) => row.id),
      );
    await collect(workspace, source, linked, out, seen);
  }
}

export async function deleteRecords(
  workspace: string,
  table: Table,
  ids: (string | number)[],
  userId: string,
) {
  const snapshots: Snapshot[] = [];
  await collect(workspace, table, [...new Set(ids)], snapshots, new Set());
  const top = snapshots[0];
  if (!top) throw apiError(404, "Record not found.");

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
  const removals = chunks(
    top.rows.map((row) => row.id),
    CHUNK,
  ).map((part) => db.delete(source).where(inArray(source.id, part as string[])));

  let results: unknown[];
  try {
    results = await db.batch([...inserts, ...removals] as never);
  } catch (error) {
    const message = [error, (error as { cause?: unknown })?.cause]
      .map((item) => (item instanceof Error ? item.message : ""))
      .join(" ");
    if (/FOREIGN KEY/i.test(message))
      throw apiError(409, "Some of these records are still linked from other records.");
    throw apiError(400, message);
  }

  const trash = (results.slice(0, inserts.length) as { id: number; tableId: number }[][])
    .flat()
    .filter((entry) => entry.tableId === table.id)
    .map((entry) => entry.id);
  return { trash };
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

async function findEntry(table: Table, entryId: number) {
  const [entry] = await db
    .select()
    .from(trashTable)
    .where(and(eq(trashTable.id, entryId), eq(trashTable.tableId, table.id)))
    .limit(1);
  if (!entry) throw apiError(404, "This record is no longer in the trash.");
  return entry;
}

async function snapshotLabels(workspace: string, columns: Column[], row: Row) {
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
    if (found) row[`${column.columnName}__label`] = found.label;
  }

  for (const key of ["created_by", "updated_by"]) {
    if (!row[key]) continue;
    const [user] = await db.all<{ name: string }>(
      sql`select "name" from "user" where "id" = ${row[key]} limit 1`,
    );
    if (user) row[`${key}__label`] = user.name;
  }
}

export async function loadTrashEntry(workspace: string, table: Table, entryId: number) {
  const entry = await findEntry(table, entryId);
  const columns = await activeColumns(table);
  const row: Row = { ...entry.data };
  await snapshotLabels(workspace, columns, row);
  return { id: entry.id, deletedAt: entry.deletedAt.getTime(), record: shapeRecord(row, columns) };
}

export async function restoreRecord(
  workspace: string,
  table: Table,
  entryId: number,
  overrides: Record<string, unknown>,
) {
  const entry = await findEntry(table, entryId);
  const snapshot = entry.data;
  const columns = await activeColumns(table);

  const edits = parseValues(columns, overrides);
  const edited = new Set(edits.map((edit) => edit.column.id));
  const kept: ParsedValue[] = columns
    .filter((column) => storable(column) && column.columnName in snapshot && !edited.has(column.id))
    .map((column) => ({ column, value: snapshot[column.columnName] as string | number | null }));
  const parsed = [...kept, ...edits];

  await assertLinksExist(workspace, parsed);
  assertRequired(columns, parsed);

  const authors = [snapshot.created_by, snapshot.updated_by].filter(
    (value): value is string => typeof value === "string",
  );
  const known = new Set(
    authors.length
      ? (
          await db.all<{ id: string }>(
            sql`select "id" from "user" where "id" in (${idList(authors)})`,
          )
        ).map((user) => user.id)
      : [],
  );
  const author = (value: unknown) => (typeof value === "string" && known.has(value) ? value : null);

  try {
    await db.batch([
      insertRecord(workspace, table, parsed, {
        id: snapshot.id,
        created_at: snapshot.created_at,
        updated_at: snapshot.updated_at,
        created_by: author(snapshot.created_by),
        updated_by: author(snapshot.updated_by),
      }),
      db.delete(trashTable).where(eq(trashTable.id, entry.id)),
    ]);
  } catch (error) {
    writeError(error, columns);
  }

  return { id: snapshot.id };
}

export async function purgeTrashEntry(table: Table, entryId: number) {
  const removed = await db
    .delete(trashTable)
    .where(and(eq(trashTable.id, entryId), eq(trashTable.tableId, table.id)))
    .returning({ id: trashTable.id });
  if (removed.length === 0) throw apiError(404, "This record is no longer in the trash.");
}

export async function purgeExpiredTrash() {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const removed = await db
    .delete(trashTable)
    .where(lt(trashTable.deletedAt, cutoff))
    .returning({ id: trashTable.id });
  return removed.length;
}
