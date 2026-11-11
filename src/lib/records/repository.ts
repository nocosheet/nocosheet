import { columnTable, tableTable } from "@db/schema";
import { and, db, eq, inArray, isNull, sql } from "void/db";
import { sqliteTable, text } from "void/schema-d1";

import { SEARCHABLE_FORMATS } from "../tables/formats";
import { physicalTableName, quoteIdent } from "../tables/naming";
import type { Column, Table } from "../tables/repository";
import { type FilterCondition, type FilterKind, filterKind } from "./filters";
import type { ResolvedRecordsQuery } from "./query";
import { shapeRecord } from "./shape";
import type { ParsedValue } from "./values";

type Fragment = ReturnType<typeof sql>;

const TEXT_SORT_FORMATS = ["text", "long_text", "email", "url", "phone", "color", "single_select"];

const SYSTEM_SORTS = ["id", "created_at", "updated_at"];

const RECORD_OPTIONS_LIMIT = 10;
const EXPORT_LIMIT = 10_000;

const raw = (text: string) => sql.raw(text);
const col = (name: string) => raw(`t.${quoteIdent(name)}`);
const like = (value: string) => `%${value.replaceAll(/[\\%_]/g, "\\$&")}%`;

function dateExpression(column: Column): Fragment {
  if (column.format === "datetime") return sql`date(${col(column.columnName)} / 1000, 'unixepoch')`;
  if (column.format === "datetime_tz") return sql`date(${col(column.columnName)})`;
  return col(column.columnName);
}

function conditionSql(column: Column, kind: FilterKind, condition: FilterCondition): Fragment {
  const target = col(column.columnName);
  const value = condition.value;
  const text = typeof value === "string" ? value : "";
  const list = Array.isArray(value) ? value : [];

  switch (condition.op) {
    case "is_empty":
      return kind === "multi_select"
        ? sql`(${target} is null or ${target} = '[]')`
        : kind === "text" || kind === "single_select"
          ? sql`(${target} is null or ${target} = '')`
          : sql`${target} is null`;
    case "is_not_empty":
      return kind === "multi_select"
        ? sql`(${target} is not null and ${target} != '[]')`
        : kind === "text" || kind === "single_select"
          ? sql`(${target} is not null and ${target} != '')`
          : sql`${target} is not null`;
    case "contains":
      return sql`${target} like ${like(text)} escape '\\'`;
    case "not_contains":
      return sql`(${target} is null or ${target} not like ${like(text)} escape '\\')`;
    case "starts_with":
      return sql`${target} like ${`${like(text).slice(1, -1)}%`} escape '\\'`;
    case "ends_with":
      return sql`${target} like ${`%${like(text).slice(1, -1)}`} escape '\\'`;
    case "equals":
      return sql`${target} = ${text} collate nocase`;
    case "not_equals":
      return sql`(${target} is null or ${target} != ${text} collate nocase)`;
    case "eq":
      return kind === "date"
        ? sql`${dateExpression(column)} = ${text}`
        : sql`${target} = ${Number(value)}`;
    case "neq":
      return sql`(${target} is null or ${target} != ${Number(value)})`;
    case "gt":
      return sql`${target} > ${Number(value)}`;
    case "gte":
      return sql`${target} >= ${Number(value)}`;
    case "lt":
      return sql`${target} < ${Number(value)}`;
    case "lte":
      return sql`${target} <= ${Number(value)}`;
    case "before":
      return sql`${dateExpression(column)} < ${text}`;
    case "after":
      return sql`${dateExpression(column)} > ${text}`;
    case "on_or_before":
      return sql`${dateExpression(column)} <= ${text}`;
    case "on_or_after":
      return sql`${dateExpression(column)} >= ${text}`;
    case "is":
      if (kind === "checkbox") return sql`coalesce(${target}, 0) = ${value === true ? 1 : 0}`;
      return sql`${target} = ${text}`;
    case "is_not":
      return sql`(${target} is null or ${target} != ${text})`;
    case "is_any_of":
      return sql`${target} in (${sql.join(
        list.map((item) => sql`${item}`),
        sql`, `,
      )})`;
    case "has_any_of":
      return sql`exists (select 1 from json_each(${target}) where value in (${sql.join(
        list.map((item) => sql`${item}`),
        sql`, `,
      )}))`;
  }
}

async function recordSource(workspace: string, table: Table, columns: Column[]) {
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
      if (target)
        selects.push(
          `(select cast(r.${quoteIdent(target.label)} as text) from ${quoteIdent(target.physicalName)} r where r."id" = t.${quoteIdent(column.columnName)}) as ${quoteIdent(`${column.columnName}__label`)}`,
        );
    }
  }

  return {
    select: raw(selects.join(", ")),
    from: sql`${raw(quoteIdent(physicalTableName(workspace, table.tableName)))} t`,
  };
}

function filterWhere(columns: Column[], query: ResolvedRecordsQuery, ownerId?: string) {
  const byName = new Map(columns.map((column) => [column.columnName, column]));
  const where: Fragment[] = ownerId ? [sql`t."created_by" = ${ownerId}`] : [];

  const conditions: Fragment[] = [];
  for (const condition of query.filters) {
    const column = byName.get(condition.column);
    const kind = column ? filterKind(column.format) : null;
    if (column && kind) conditions.push(conditionSql(column, kind, condition));
  }
  if (conditions.length)
    where.push(sql`(${sql.join(conditions, query.join === "or" ? sql` or ` : sql` and `)})`);

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

function recordsOrder(columns: Column[], query: ResolvedRecordsQuery) {
  if (!query.sort) return sql`t."id" asc`;
  const direction = raw(query.order === "desc" ? "desc" : "asc");

  if (SYSTEM_SORTS.includes(query.sort))
    return sql`${raw(`t.${quoteIdent(query.sort)}`)} ${direction}, t."id" asc`;

  const column = columns.find((item) => item.columnName === query.sort);
  if (!column) return sql`t."id" asc`;
  const collate = raw(TEXT_SORT_FORMATS.includes(column.format) ? " collate nocase" : "");
  return sql`${col(column.columnName)} is null, ${col(column.columnName)}${collate} ${direction}, t."id" asc`;
}

export async function findRecords(
  workspace: string,
  table: Table,
  columns: Column[],
  query: ResolvedRecordsQuery,
  ownerId?: string,
) {
  const { select, from } = await recordSource(workspace, table, columns);
  const condition = filterWhere(columns, query, ownerId);
  const orderBy = recordsOrder(columns, query);

  const [rows, [{ n: total }]] = await Promise.all([
    db.all<Record<string, unknown>>(
      sql`select ${select} from ${from} where ${condition} order by ${orderBy} limit ${query.pageSize} offset ${(query.page - 1) * query.pageSize}`,
    ),
    db.all<{ n: number }>(sql`select count(*) as n from ${from} where ${condition}`),
  ]);
  return { total: Number(total), rows: rows.map((row) => shapeRecord(row, columns)) };
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
