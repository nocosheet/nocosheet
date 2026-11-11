import { columnTable, tableTable } from "@db/schema";
import { HTTPException } from "hono/http-exception";
import { and, asc, db, eq, inArray, isNull, sql } from "void/db";

import { SEARCHABLE_FORMATS } from "../tables/formats";
import { physicalTableName, quoteIdent } from "../tables/naming";
import {
  conditionError,
  type FilterCondition,
  type FilterKind,
  filterKind,
  isSortableFormat,
} from "./filters";
import type { ResolvedRecordsQuery } from "./query";
import { isEditableColumn, toDbValue, valueSchema } from "./values";

type Fragment = ReturnType<typeof sql>;
type Column = typeof columnTable.$inferSelect;
type Table = typeof tableTable.$inferSelect;

const TEXT_SORT_FORMATS = ["text", "long_text", "email", "url", "phone", "color", "single_select"];

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

const parse = (value: unknown) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

async function recordSource(workspace: string, table: Table) {
  const columns = await db
    .select()
    .from(columnTable)
    .where(and(eq(columnTable.tableId, table.id), isNull(columnTable.deletedAt)))
    .orderBy(asc(columnTable.position));

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
  if (table.hasCreatedAt) selects.push('t."created_at" as "created_at"');
  if (table.hasUpdatedAt) selects.push('t."updated_at" as "updated_at"');
  for (const [flag, name] of [
    [table.hasCreatedBy, "created_by"],
    [table.hasUpdatedBy, "updated_by"],
  ] as const) {
    if (flag)
      selects.push(
        `t."${name}" as "${name}"`,
        `(select u."name" from "user" u where u."id" = t."${name}") as "${name}__label"`,
      );
  }
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
    columns,
    select: raw(selects.join(", ")),
    from: sql`${raw(quoteIdent(physicalTableName(workspace, table.tableName)))} t`,
  };
}

function shapeRecord(row: Record<string, unknown>, columns: Column[]) {
  const record: Record<string, unknown> = { id: row.id };
  for (const key of ["created_at", "updated_at"]) if (key in row) record[key] = row[key];
  for (const key of ["created_by", "updated_by"])
    if (key in row)
      record[key] = row[key] ? { id: row[key], label: row[`${key}__label`] ?? null } : null;
  for (const column of columns) {
    const value = row[column.columnName];
    if (column.format === "checkbox")
      record[column.columnName] = value === null ? null : value === 1;
    else if (["multi_select", "json", "file", "image"].includes(column.format))
      record[column.columnName] = parse(value);
    else if (column.format === "relation")
      record[column.columnName] =
        value === null || value === undefined
          ? null
          : { id: value, label: row[`${column.columnName}__label`] ?? null };
    else record[column.columnName] = value ?? null;
  }
  return record;
}

export async function loadRecords(workspace: string, table: Table, query: ResolvedRecordsQuery) {
  const { columns, select, from } = await recordSource(workspace, table);
  const byName = new Map(columns.map((column) => [column.columnName, column]));

  const where: Fragment[] = [];

  const conditions: Fragment[] = [];
  for (const condition of query.filters) {
    const column = byName.get(condition.column);
    const kind = column ? filterKind(column.format) : null;
    if (!column || !kind || !column.isFilterable)
      throw new HTTPException(400, { message: `"${condition.column}" can't be filtered.` });
    const error = conditionError(kind, condition);
    if (error) throw new HTTPException(400, { message: `${column.name}: ${error}` });
    conditions.push(conditionSql(column, kind, condition));
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

  let orderBy = sql`t."id" asc`;
  if (query.sort) {
    const system = {
      id: true,
      created_at: table.hasCreatedAt,
      updated_at: table.hasUpdatedAt,
    } as Record<string, boolean>;
    const column = byName.get(query.sort);
    const direction = raw(query.order === "desc" ? "desc" : "asc");

    if (system[query.sort]) {
      orderBy = sql`${raw(`t.${quoteIdent(query.sort)}`)} ${direction}, t."id" asc`;
    } else if (!column || !column.isSortable || !isSortableFormat(column.format)) {
      throw new HTTPException(400, { message: `"${query.sort}" can't be sorted.` });
    } else {
      const collate = raw(TEXT_SORT_FORMATS.includes(column.format) ? " collate nocase" : "");
      orderBy = sql`${col(column.columnName)} is null, ${col(column.columnName)}${collate} ${direction}, t."id" asc`;
    }
  }

  const condition = where.length ? sql`${sql.join(where, sql` and `)}` : sql`1 = 1`;

  try {
    const [rows, [{ n: total }]] = await Promise.all([
      db.all<Record<string, unknown>>(
        sql`select ${select} from ${from} where ${condition} order by ${orderBy} limit ${query.pageSize} offset ${(query.page - 1) * query.pageSize}`,
      ),
      db.all<{ n: number }>(sql`select count(*) as n from ${from} where ${condition}`),
    ]);
    return { total: Number(total), rows: rows.map((row) => shapeRecord(row, columns)) };
  } catch (error) {
    throw new HTTPException(400, {
      message: error instanceof Error ? error.message : "The records could not be loaded.",
    });
  }
}

export async function loadRecord(workspace: string, table: Table, recordId: string) {
  const { columns, select, from } = await recordSource(workspace, table);
  const [row] = await db.all<Record<string, unknown>>(
    sql`select ${select} from ${from} where t."id" = ${recordId} limit 1`,
  );
  if (!row) throw new HTTPException(404, { message: "Record not found." });
  return shapeRecord(row, columns);
}

export async function loadExportRecords(workspace: string, table: Table) {
  const columns = (await activeColumns(table)).filter((column) => column.format !== "binary");
  const names = [
    "id",
    ...(table.hasCreatedAt ? ["created_at"] : []),
    ...(table.hasUpdatedAt ? ["updated_at"] : []),
    ...(table.hasCreatedBy ? ["created_by"] : []),
    ...(table.hasUpdatedBy ? ["updated_by"] : []),
    ...columns.map((column) => column.columnName),
  ];

  const rows = await db.all<Record<string, unknown>>(
    sql`select ${raw(names.map((name) => `t.${quoteIdent(name)} as ${quoteIdent(name)}`).join(", "))} from ${raw(quoteIdent(physicalTableName(workspace, table.tableName)))} t order by t."id" limit ${EXPORT_LIMIT + 1}`,
  );

  return {
    rows: rows.slice(0, EXPORT_LIMIT).map((row) => shapeRecord(row, columns)),
    truncated: rows.length > EXPORT_LIMIT,
  };
}

export async function loadRecordOptions(workspace: string, table: Table, term: string) {
  const [title] = table.titleColumnId
    ? await db
        .select({ columnName: columnTable.columnName })
        .from(columnTable)
        .where(and(eq(columnTable.id, table.titleColumnId), isNull(columnTable.deletedAt)))
        .limit(1)
    : [];
  const label = col(title?.columnName ?? "id");
  const source = raw(`${quoteIdent(physicalTableName(workspace, table.tableName))} t`);

  return db.all<{ id: string | number; label: string | null }>(
    sql`select t."id" as "id", ${title ? sql`cast(${label} as text)` : sql`null`} as "label" from ${source} ${
      term ? sql`where cast(${label} as text) like ${like(term)} escape '\\'` : sql``
    } order by t."id" limit ${RECORD_OPTIONS_LIMIT}`,
  );
}

export async function deleteRecords(workspace: string, table: Table, ids: (string | number)[]) {
  const unique = [...new Set(ids)];
  let deleted: unknown[] = [];
  try {
    deleted = await db.all(
      sql`delete from ${raw(quoteIdent(physicalTableName(workspace, table.tableName)))} where "id" in (${sql.join(
        unique.map((id) => sql`${id}`),
        sql`, `,
      )}) returning "id"`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new HTTPException(/FOREIGN KEY/i.test(message) ? 409 : 400, {
      message: /FOREIGN KEY/i.test(message)
        ? "Some of these records are still linked from other records."
        : message,
    });
  }
  if (deleted.length === 0) throw new HTTPException(404, { message: "Record not found." });
}

async function activeColumns(table: Table) {
  return db
    .select()
    .from(columnTable)
    .where(and(eq(columnTable.tableId, table.id), isNull(columnTable.deletedAt)));
}

function parseValues(columns: Column[], values: Record<string, unknown>) {
  const byName = new Map(columns.map((column) => [column.columnName, column]));
  return Object.entries(values).map(([key, input]) => {
    const column = byName.get(key);
    if (!column || !isEditableColumn(column))
      throw new HTTPException(400, { message: `"${key}" can't be edited.` });
    const parsed = valueSchema(column).safeParse(input);
    if (!parsed.success)
      throw new HTTPException(400, {
        message: `${column.name}: ${parsed.error.issues[0]?.message ?? "Invalid value"}`,
      });
    return { column, value: toDbValue(column.format, parsed.data) };
  });
}

async function assertLinksExist(
  workspace: string,
  parsed: { column: Column; value: string | number | null }[],
) {
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
    if (!target)
      throw new HTTPException(400, {
        message: `${column.name}: the linked table no longer exists.`,
      });
    const [found] = await db.all<{ found: number }>(
      sql`select 1 as found from ${raw(quoteIdent(physicalTableName(workspace, target.tableName)))} where "id" = ${value} limit 1`,
    );
    if (!found)
      throw new HTTPException(400, {
        message: `${column.name}: the linked record no longer exists. Refresh and pick again.`,
      });
  }
}

function writeError(error: unknown): never {
  const message = [error, (error as { cause?: unknown })?.cause]
    .map((item) => (item instanceof Error ? item.message : ""))
    .join(" ");
  if (/UNIQUE constraint/i.test(message))
    throw new HTTPException(409, { message: "Another record already uses this value." });
  if (/FOREIGN KEY/i.test(message))
    throw new HTTPException(400, { message: "A linked record or user doesn't exist." });
  if (/CHECK constraint/i.test(message))
    throw new HTTPException(400, { message: "A value doesn't meet its column's rules." });
  if (/NOT NULL constraint/i.test(message))
    throw new HTTPException(400, { message: "A required value is missing." });
  throw new HTTPException(400, { message });
}

export async function updateRecord(
  workspace: string,
  table: Table,
  recordId: string,
  values: Record<string, unknown>,
  userId: string,
) {
  const parsed = parseValues(await activeColumns(table), values);
  if (parsed.length === 0) throw new HTTPException(400, { message: "Nothing to update." });
  await assertLinksExist(workspace, parsed);

  const assignments = parsed.map(
    ({ column, value }) => sql`${raw(quoteIdent(column.columnName))} = ${value}`,
  );
  if (table.hasUpdatedAt)
    assignments.push(sql`"updated_at" = cast(unixepoch('subsec') * 1000 as integer)`);
  if (table.hasUpdatedBy) assignments.push(sql`"updated_by" = ${userId}`);

  let updated: unknown[] = [];
  try {
    updated = await db.all(
      sql`update ${raw(quoteIdent(physicalTableName(workspace, table.tableName)))} set ${sql.join(assignments, sql`, `)} where "id" = ${recordId} returning "id"`,
    );
  } catch (error) {
    writeError(error);
  }
  if (updated.length === 0) throw new HTTPException(404, { message: "Record not found." });

  return { ok: true };
}

export async function createRecord(
  workspace: string,
  table: Table,
  values: Record<string, unknown>,
  userId: string,
) {
  const columns = await activeColumns(table);
  const parsed = parseValues(columns, values);
  await assertLinksExist(workspace, parsed);

  const missing = columns.find(
    (column) =>
      column.isRequired &&
      isEditableColumn(column) &&
      column.defaultValue === null &&
      !parsed.some((item) => item.column.id === column.id && item.value !== null),
  );
  if (missing) throw new HTTPException(400, { message: `${missing.name}: This field is required` });

  const names = parsed.map(({ column }) => raw(quoteIdent(column.columnName)));
  const bound = parsed.map(({ value }) => sql`${value}`);
  if (table.hasCreatedBy) {
    names.push(raw('"created_by"'));
    bound.push(sql`${userId}`);
  }
  if (table.hasUpdatedBy) {
    names.push(raw('"updated_by"'));
    bound.push(sql`${userId}`);
  }

  const target = raw(quoteIdent(physicalTableName(workspace, table.tableName)));
  let created: { id: string | number } | undefined;
  try {
    [created] = await db.all<{ id: string | number }>(
      names.length
        ? sql`insert into ${target} (${sql.join(names, sql`, `)}) values (${sql.join(bound, sql`, `)}) returning "id"`
        : sql`insert into ${target} default values returning "id"`,
    );
  } catch (error) {
    writeError(error);
  }
  if (!created) throw new HTTPException(400, { message: "The record could not be created." });

  return { id: created.id };
}
