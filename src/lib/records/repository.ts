import { columnTable, tableTable } from "@db/schema";
import { and, db, eq, inArray, isNull, sql } from "void/db";
import { sqliteTable, text } from "void/schema-d1";

import { NOCASE_FORMATS, SEARCHABLE_FORMATS } from "../tables/formats";
import { physicalTableName, quoteIdent } from "../tables/naming";
import type { Column, Table } from "../tables/repository";
import { conditionText } from "./condition";
import { decodeCursor, encodeCursor, type RecordCursor } from "./cursor";
import { type FilterCondition, filterKind } from "./filters";
import type { TypedRecordsQuery } from "./query";
import { shapeRecord } from "./shape";
import type { ParsedValue } from "./values";

type Fragment = ReturnType<typeof sql>;

const SYSTEM_SORTS = ["id", "created_at", "updated_at"];

const RECORD_OPTIONS_LIMIT = 10;
const EXPORT_LIMIT = 10_000;

const raw = (text: string) => sql.raw(text);
const col = (name: string) => raw(`t.${quoteIdent(name)}`);
const like = (value: string) => `%${value.replaceAll(/[\\%_]/g, "\\$&")}%`;

async function recordSource(workspace: string, table: Table, columns: Column[], source?: string) {
  const targetIds = columns
    .filter((column) => column.format === "relation")
    .map((column) => Number((column.options as { tableId?: number }).tableId));
  const targets = new Map<number, { physicalName: string; label: string }>();
  if (targetIds.length) {
    const rows = await db
      .select({ id: tableTable.id, tableName: tableTable.tableName, title: columnTable.columnName })
      .from(tableTable)
      .leftJoin(columnTable, eq(columnTable.id, tableTable.titleColumnId))
      .where(inArray(tableTable.id, targetIds));
    for (const row of rows)
      targets.set(row.id, {
        physicalName: physicalTableName(workspace, row.tableName),
        label: row.title ?? "id",
      });
  }

  const selects = ['t."id" as "id"'];
  selects.push('t."created_at" as "created_at"', 't."updated_at" as "updated_at"');
  for (const name of ["created_by", "updated_by"])
    selects.push(
      `t."${name}" as "${name}"`,
      `(select u."name" from "user" u where u."id" = t."${name}") as "${name}__label"`,
    );
  for (const column of columns) {
    selects.push(`t.${quoteIdent(column.columnName)} as ${quoteIdent(column.columnName)}`);
    if (column.format === "relation") {
      const target = targets.get(Number((column.options as { tableId?: number }).tableId));
      if (target) {
        selects.push(
          `(select cast(r.${quoteIdent(target.label)} as text) from ${quoteIdent(target.physicalName)} r where r."id" = t.${quoteIdent(column.columnName)}) as ${quoteIdent(`${column.columnName}__label`)}`,
        );
      }
    }
  }

  return {
    select: raw(selects.join(", ")),
    from: sql`${raw(quoteIdent(source ?? physicalTableName(workspace, table.tableName)))} t`,
  };
}

function conditionsWhere(columns: Column[], filters: FilterCondition[]) {
  const byName = new Map(columns.map((column) => [column.columnName, column]));
  const params: (string | number)[] = [];
  const bind = (value: string | number) => {
    params.push(value);
    return "?";
  };

  const conditions: string[] = [];
  for (const condition of filters) {
    const column = byName.get(condition.column);
    const kind = column ? filterKind(column.format) : null;
    if (column && kind) conditions.push(conditionText(column, kind, condition, bind));
  }
  if (!conditions.length) return undefined;

  const parts = `(${conditions.join(" and ")})`.split("?");
  return sql.join(
    parts.flatMap((part, index) =>
      index < params.length ? [raw(part), sql`${params[index]}`] : [raw(part)],
    ),
    raw(""),
  );
}

function filterWhere(columns: Column[], query: TypedRecordsQuery, ownerId?: string) {
  const where: Fragment[] = ownerId ? [sql`t."created_by" = ${ownerId}`] : [];

  const filtered = conditionsWhere(columns, query.filters);
  if (filtered) where.push(filtered);

  if (query.q) {
    const searchable = columns.filter(
      (column) => column.isSearchable && SEARCHABLE_FORMATS.includes(column.format as never),
    );
    if (searchable.length)
      where.push(
        sql`(${sql.join(
          searchable.map(
            (column) => sql`${col(column.columnName)} like ${like(query.q)} escape '\\'`,
          ),
          sql` or `,
        )})`,
      );
  }

  return where.length ? sql`${sql.join(where, sql` and `)}` : sql`1 = 1`;
}

type SortSpec = { name: string; nocase: boolean; direction: "asc" | "desc" };

function sortSpec(columns: Column[], query: TypedRecordsQuery): SortSpec {
  const fallback: SortSpec = { name: "id", nocase: false, direction: "asc" };
  if (!query.sort) return fallback;
  const direction = query.order === "desc" ? "desc" : "asc";

  if (SYSTEM_SORTS.includes(query.sort)) return { name: query.sort, nocase: false, direction };

  const column = columns.find((item) => item.columnName === query.sort);
  if (!column) return fallback;
  return {
    name: column.columnName,
    nocase: NOCASE_FORMATS.includes(column.format as never),
    direction,
  };
}

const sortTarget = (spec: SortSpec) =>
  raw(`t.${quoteIdent(spec.name)}${spec.nocase ? " collate nocase" : ""}`);

type Key = { expr: Fragment; desc: boolean };

function sortKeys(spec: SortSpec): Key[] {
  const desc = spec.direction === "desc";
  const id = { expr: sql`t."id"`, desc };
  return spec.name === "id" ? [id] : [{ expr: sortTarget(spec), desc }, id];
}

const orderOf = (keys: Key[]) =>
  sql.join(
    keys.map((key) => sql`${key.expr} ${raw(key.desc ? "desc" : "asc")}`),
    sql`, `,
  );

function seekSegments(spec: SortSpec, cursor: RecordCursor): Fragment[] {
  const ascending = spec.direction === "asc";
  const idOp = raw(ascending ? ">" : "<");
  if (spec.name === "id") return [sql`t."id" ${idOp} ${cursor[0]}`];

  const [value, id] = cursor;
  const bare = col(spec.name);

  if (value === null)
    return ascending
      ? [sql`${bare} is null and t."id" > ${id}`, sql`${bare} is not null`]
      : [sql`${bare} is null and t."id" < ${id}`];

  const target = sortTarget(spec);
  const inclusive = raw(ascending ? ">=" : "<=");
  const strict = raw(ascending ? ">" : "<");
  const after = sql`${target} ${inclusive} ${value} and (${target} ${strict} ${value} or (${target} = ${value} and t."id" ${idOp} ${id}))`;
  return ascending ? [after] : [after, sql`${bare} is null`];
}

export async function findRecords(
  workspace: string,
  table: Table,
  columns: Column[],
  query: TypedRecordsQuery,
  ownerId?: string,
  source?: string,
) {
  const { select, from } = await recordSource(workspace, table, columns, source);
  const condition = filterWhere(columns, query, ownerId);
  const forward = sortSpec(columns, query);
  const backward = query.dir === "prev";
  const spec: SortSpec = backward
    ? { ...forward, direction: forward.direction === "asc" ? "desc" : "asc" }
    : forward;
  const cursor = query.cursor ? decodeCursor(query.cursor) : null;
  if (backward && !cursor) throw new Error("The page cursor is invalid.");
  const limit = query.pageSize + 1;

  const keys = sortKeys(spec);
  if (cursor && cursor.length !== keys.length) throw new Error("The page cursor is invalid.");
  const order = orderOf(keys);
  const segments = cursor ? seekSegments(spec, cursor) : [sql`1 = 1`];

  const found: Record<string, unknown>[] = [];
  for (const segment of segments) {
    found.push(
      ...(await db.all<Record<string, unknown>>(
        sql`select ${select} from ${from} where ${condition} and ${segment} order by ${order} limit ${limit - found.length}`,
      )),
    );
    if (found.length >= limit) break;
  }

  const keyOf = (row: Record<string, unknown>) =>
    encodeCursor(
      spec.name === "id"
        ? [row.id as string | number]
        : [(row[spec.name] as string | number | null) ?? null, row.id as string | number],
    );

  const hasMore = found.length > query.pageSize;
  const page = found.slice(0, query.pageSize);
  if (backward) page.reverse();

  const first = page[0];
  const last = page.at(-1);
  const startCursor = backward ? (hasMore ? keyOf(found[query.pageSize]) : null) : query.cursor;
  const nextCursor = last && (backward || hasMore) ? keyOf(last) : null;
  const prevCursor = first && startCursor ? keyOf(first) : null;

  return {
    nextCursor,
    prevCursor,
    startCursor: startCursor ?? null,
    rows: page.map((row) => shapeRecord(row, columns)),
  };
}

export async function findRecord(
  workspace: string,
  table: Table,
  columns: Column[],
  recordId: string,
  ownerId?: string,
) {
  const { select, from } = await recordSource(workspace, table, columns);
  const [row] = await db.all<Record<string, unknown>>(
    sql`select ${select} from ${from} where t."id" = ${recordId} ${ownerId ? sql`and t."created_by" = ${ownerId}` : sql``} limit 1`,
  );
  return row ? shapeRecord(row, columns) : undefined;
}

export async function findExportRecords(
  workspace: string,
  table: Table,
  columns: Column[],
  ownerId?: string,
) {
  const exported = columns.filter((column) => column.format !== "binary");
  const names = [
    "id",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    ...exported.map((column) => column.columnName),
  ];

  const rows = await db.all<Record<string, unknown>>(
    sql`select ${raw(names.map((name) => `t.${quoteIdent(name)} as ${quoteIdent(name)}`).join(", "))} from ${raw(quoteIdent(physicalTableName(workspace, table.tableName)))} t ${ownerId ? sql`where t."created_by" = ${ownerId}` : sql``} order by t."id" limit ${EXPORT_LIMIT + 1}`,
  );

  return {
    rows: rows.slice(0, EXPORT_LIMIT).map((row) => shapeRecord(row, exported)),
    truncated: rows.length > EXPORT_LIMIT,
  };
}

export async function findRecordOptions(
  workspace: string,
  table: Table,
  term: string,
  ownerId?: string,
) {
  const [title] = table.titleColumnId
    ? await db
        .select({ columnName: columnTable.columnName })
        .from(columnTable)
        .where(and(eq(columnTable.id, table.titleColumnId), isNull(columnTable.deletedAt)))
        .limit(1)
    : [];
  const label = col(title?.columnName ?? "id");
  const source = raw(`${quoteIdent(physicalTableName(workspace, table.tableName))} t`);

  const conditions: Fragment[] = [];
  if (ownerId) conditions.push(sql`t."created_by" = ${ownerId}`);
  if (term) conditions.push(sql`cast(${label} as text) like ${like(term)} escape '\\'`);
  const where = conditions.length ? sql`where ${sql.join(conditions, sql` and `)}` : sql``;

  return db.all<{ id: string | number; label: string | null }>(
    sql`select t."id" as "id", ${title ? sql`cast(${label} as text)` : sql`null`} as "label" from ${source} ${where} order by t."id" limit ${RECORD_OPTIONS_LIMIT}`,
  );
}

export type BrokenLink = { column: Column; reason: "table" | "record" };

export async function findBrokenLink(
  workspace: string,
  parsed: ParsedValue<Column>[],
): Promise<BrokenLink | undefined> {
  for (const { column, value } of parsed) {
    if (column.format !== "relation" || value === null) continue;
    const [target] = await db
      .select({ tableName: tableTable.tableName })
      .from(tableTable)
      .where(
        and(
          eq(tableTable.id, Number((column.options as { tableId?: number }).tableId)),
          isNull(tableTable.deletedAt),
        ),
      )
      .limit(1);
    if (!target) return { column, reason: "table" };
    const [found] = await db.all<{ found: number }>(
      sql`select 1 as found from ${raw(quoteIdent(physicalTableName(workspace, target.tableName)))} where "id" = ${value} limit 1`,
    );
    if (!found) return { column, reason: "record" };
  }
  return undefined;
}

export function recordsTable(workspace: string, table: Table, names: string[] = []) {
  return sqliteTable(
    physicalTableName(workspace, table.tableName),
    Object.fromEntries(["id", ...names].map((name) => [name, text(name)])),
  );
}

export function insertRecord(
  workspace: string,
  table: Table,
  parsed: ParsedValue<Column>[],
  system: Record<string, unknown>,
) {
  const row = {
    ...Object.fromEntries(parsed.map(({ column, value }) => [column.columnName, value])),
    ...system,
  } as Record<string, string>;
  const target = recordsTable(workspace, table, Object.keys(row));
  return db.insert(target).values(row).returning({ id: target.id });
}

export async function createRecordRow(
  workspace: string,
  table: Table,
  parsed: ParsedValue<Column>[],
  userId: string,
) {
  const [created] = (await insertRecord(workspace, table, parsed, {
    created_by: userId,
    updated_by: userId,
  })) as { id: string | number }[];
  return created;
}

export async function updateRecordRow(
  workspace: string,
  table: Table,
  recordId: string,
  parsed: ParsedValue<Column>[],
  userId: string,
  ownerId?: string,
) {
  const assignments = parsed.map(
    ({ column, value }) => sql`${raw(quoteIdent(column.columnName))} = ${value}`,
  );
  assignments.push(
    sql`"updated_at" = cast(unixepoch('subsec') * 1000 as integer)`,
    sql`"updated_by" = ${userId}`,
  );

  const updated = await db.all(
    sql`update ${raw(quoteIdent(physicalTableName(workspace, table.tableName)))} set ${sql.join(assignments, sql`, `)} where "id" = ${recordId} ${ownerId ? sql`and "created_by" = ${ownerId}` : sql``} returning "id"`,
  );
  return updated.length > 0;
}

export async function countOwnedRecords(
  workspace: string,
  table: Table,
  ids: (string | number)[],
  ownerId: string,
) {
  const unique = [...new Set(ids)];
  let owned = 0;
  for (let start = 0; start < unique.length; start += 50) {
    const part = unique.slice(start, start + 50);
    const [row] = await db.all<{ n: number }>(
      sql`select count(*) as n from ${raw(quoteIdent(physicalTableName(workspace, table.tableName)))} where "created_by" = ${ownerId} and "id" in (${sql.join(
        part.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    );
    owned += Number(row?.n ?? 0);
  }
  return owned;
}
