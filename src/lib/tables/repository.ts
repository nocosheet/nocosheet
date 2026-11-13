import { columnTable, favoriteTable, resourceTable, tableTable, viewTable } from "@db/schema";
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

import type { TrashQuery } from "../trash/query";
import { buildDropView } from "../views/ddl";
import { physicalViewName } from "../views/naming";
import {
  buildAddColumn,
  buildCreateIndex,
  buildCreateTable,
  buildDropColumn,
  buildDropIndex,
  buildDropTable,
  columnSqliteType,
  compileExpressions,
  indexKind,
  indexName,
  type RelationTarget,
} from "./ddl";
import type { ColumnFormat } from "./formats";
import { newColumnName, newTableName, physicalTableName } from "./naming";
import type { TablesQuery } from "./query";
import type { ColumnValues, TableValues } from "./validation";

export type Table = typeof tableTable.$inferSelect;
export type Column = typeof columnTable.$inferSelect;

const defined = <T extends object>(values: T) =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

const linkTarget = sql`json_extract(${columnTable.options}, '$.tableId')`;

export async function findTable(id: number) {
  const [row] = await db
    .select()
    .from(tableTable)
    .where(and(eq(tableTable.id, id), isNull(tableTable.deletedAt)))
    .limit(1);
  return row as Table | undefined;
}

export async function findTables(ids: number[]) {
  return db
    .select()
    .from(tableTable)
    .where(and(inArray(tableTable.id, ids), isNull(tableTable.deletedAt)));
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
  return row as Column | undefined;
}

export async function findColumnByName(tableId: number, columnName: string) {
  const [row] = await db
    .select()
    .from(columnTable)
    .where(
      and(
        eq(columnTable.tableId, tableId),
        eq(columnTable.columnName, columnName),
        isNull(columnTable.deletedAt),
      ),
    )
    .limit(1);
  return row as Column | undefined;
}

export async function listColumns(tableId: number) {
  return db
    .select()
    .from(columnTable)
    .where(and(eq(columnTable.tableId, tableId), isNull(columnTable.deletedAt)))
    .orderBy(asc(columnTable.position));
}

export async function listTables(query: TablesQuery) {
  const { page, pageSize, sort, order, q } = query;

  const columnCount = sql<number>`(select count(*) from ${columnTable} where ${columnTable.tableId} = ${tableTable}.id and ${columnTable.deletedAt} is null)`;
  const pattern = q ? `%${q.replaceAll(/[\\%_]/g, "\\$&")}%` : null;

  const where = and(
    isNull(tableTable.deletedAt),
    pattern
      ? or(
          sql`${tableTable.name} like ${pattern} escape '\\'`,
          sql`${tableTable.description} like ${pattern} escape '\\'`,
        )
      : undefined,
  );

  const sortExpression = {
    name: sql`lower(${tableTable.name})`,
    groupName: sql`lower(${tableTable.groupName})`,
    columnCount,
    updatedAt: tableTable.updatedAt,
  }[sort];
  const direction = order === "desc" ? desc : asc;

  const [rows, [{ total }]] = await db.batch([
    db
      .select({
        id: tableTable.id,
        name: tableTable.name,
        icon: tableTable.icon,
        groupName: tableTable.groupName,
        description: tableTable.description,
        idType: tableTable.idType,
        titleColumnId: tableTable.titleColumnId,
        columnCount,
        updatedAt: tableTable.updatedAt,
      })
      .from(tableTable)
      .where(where)
      .orderBy(direction(sortExpression), asc(tableTable.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(tableTable).where(where),
  ]);

  return { rows, total };
}

export async function listSidebarRows(userId: string) {
  return db
    .select({
      id: tableTable.id,
      name: tableTable.name,
      icon: tableTable.icon,
      groupName: tableTable.groupName,
      updatedAt: tableTable.updatedAt,
      favoritedAt: favoriteTable.createdAt,
    })
    .from(tableTable)
    .leftJoin(
      favoriteTable,
      and(eq(favoriteTable.tableId, tableTable.id), eq(favoriteTable.userId, userId)),
    )
    .where(isNull(tableTable.deletedAt))
    .orderBy(asc(tableTable.position), asc(tableTable.id));
}

export async function addFavorite(userId: string, tableId: number) {
  await db.insert(favoriteTable).values({ userId, tableId }).onConflictDoNothing();
}

export async function removeFavorite(userId: string, tableId: number) {
  await db
    .delete(favoriteTable)
    .where(and(eq(favoriteTable.userId, userId), eq(favoriteTable.tableId, tableId)));
}

export async function findTrashedTableByName(name: string) {
  const [row] = await db
    .select({ name: tableTable.name })
    .from(tableTable)
    .where(and(sql`lower(${tableTable.name}) = lower(${name})`, isNotNull(tableTable.deletedAt)))
    .limit(1);
  return row;
}

export async function createTable(workspace: string, body: TableValues, userId: string) {
  const tableName = newTableName();
  const physicalName = physicalTableName(workspace, tableName);

  const [, , inserted] = await db.batch([
    db.run(sql.raw(buildCreateTable({ ...body, physicalName }))),
    db.insert(resourceTable).values({ kind: "table" }),
    db
      .insert(tableTable)
      .values({
        id: sql`last_insert_rowid()`,
        tableName,
        name: body.name,
        description: body.description,
        icon: body.icon,
        groupName: body.groupName,
        idType: body.idType,
        position: sql`(select coalesce(max(position), -1) + 1 from ${tableTable})`,
        createdBy: userId,
      })
      .returning(),
  ]);
  return inserted[0];
}

export async function updateTable(
  id: number,
  fields: {
    name?: string;
    icon?: string | null;
    groupName?: string | null;
    description?: string | null;
    titleColumnId?: number | null;
  },
) {
  const [updated] = await db
    .update(tableTable)
    .set({ ...defined(fields), updatedAt: new Date() })
    .where(eq(tableTable.id, id))
    .returning();
  return updated;
}

export async function findRelationTarget(workspace: string, tableId: number) {
  const [target] = await db
    .select()
    .from(tableTable)
    .where(and(eq(tableTable.id, tableId), isNull(tableTable.deletedAt)))
    .limit(1);
  if (!target) return undefined;
  return {
    id: target.id,
    physicalName: physicalTableName(workspace, target.tableName),
    idType: target.idType,
  };
}

export async function createColumn(
  workspace: string,
  table: Table,
  body: ColumnValues,
  targets: Map<number, RelationTarget>,
) {
  const physicalName = physicalTableName(workspace, table.tableName);
  const columnName = newColumnName();

  const references = new Map(
    (await listColumns(table.id)).map((item) => [item.name.toLowerCase(), item.columnName]),
  );
  references.set(body.name.toLowerCase(), columnName);

  const { generated, check } = compileExpressions(body, references);
  const [first, ...rest] = buildAddColumn(
    workspace,
    physicalName,
    columnName,
    body,
    targets,
    references,
  ).map((statement) => db.run(sql.raw(statement)));

  await db.batch([
    first,
    ...rest,
    db.insert(columnTable).values({
      tableId: table.id,
      columnName,
      name: body.name,
      icon: body.icon,
      description: body.description,
      type: columnSqliteType(body, targets),
      format: body.format,
      options: body.options,
      checkExpression: check?.stored ?? null,
      generatedExpression: generated?.stored ?? null,
      isRequired: body.isRequired,
      isFilterable: body.isFilterable,
      isSortable: body.isSortable,
      isSearchable: body.isSearchable,
      isUnique: body.isUnique,
      isHidden: body.isHidden,
      defaultValue: body.defaultValue,
      position: body.position,
    }),
    db.update(tableTable).set({ updatedAt: new Date() }).where(eq(tableTable.id, table.id)),
  ]);

  return (await findColumnByName(table.id, columnName)) as Column;
}

export async function updateColumn(
  workspace: string,
  table: Table,
  column: Column,
  patch: Partial<Column>,
) {
  const physicalName = physicalTableName(workspace, table.tableName);
  const changes = defined(patch);
  const before = indexKind(column);
  const after = indexKind({ ...column, ...changes });
  const statements = [];
  if (before !== after) {
    if (before)
      statements.push(
        db.run(sql.raw(buildDropIndex(indexName(workspace, column.columnName, before)))),
      );
    if (after)
      statements.push(
        db.run(
          sql.raw(
            buildCreateIndex(
              indexName(workspace, column.columnName, after),
              physicalName,
              column.columnName,
              after,
              column.format as ColumnFormat,
            ),
          ),
        ),
      );
  }

  await db.batch([
    ...statements,
    db.update(columnTable).set(changes).where(eq(columnTable.id, column.id)),
    db.update(tableTable).set({ updatedAt: new Date() }).where(eq(tableTable.id, table.id)),
  ] as never);

  return findColumn(table.id, column.id);
}

export async function reorderColumns(tableId: number, ids: number[]) {
  await db.batch([
    ...ids.map((id, index) =>
      db
        .update(columnTable)
        .set({ position: index })
        .where(and(eq(columnTable.id, id), eq(columnTable.tableId, tableId))),
    ),
    db.update(tableTable).set({ updatedAt: new Date() }).where(eq(tableTable.id, tableId)),
  ] as never);
}

export async function dropColumn(workspace: string, table: Table, column: Column) {
  const physicalName = physicalTableName(workspace, table.tableName);
  const kind = indexKind(column);

  await db.batch([
    db.run(
      sql.raw(kind ? buildDropIndex(indexName(workspace, column.columnName, kind)) : "select 1"),
    ),
    db.run(sql.raw(buildDropColumn(physicalName, column.columnName))),
    db.delete(columnTable).where(eq(columnTable.id, column.id)),
    db.update(tableTable).set({ updatedAt: new Date() }).where(eq(tableTable.id, table.id)),
  ]);
}

export async function findLinkingColumns(ids: number[], options: { liveOnly: boolean }) {
  return db
    .select({ column: columnTable.name, table: tableTable.name })
    .from(columnTable)
    .innerJoin(tableTable, eq(columnTable.tableId, tableTable.id))
    .where(
      and(
        eq(columnTable.format, "relation"),
        isNull(columnTable.deletedAt),
        options.liveOnly ? isNull(tableTable.deletedAt) : undefined,
        notInArray(columnTable.tableId, ids),
        inArray(linkTarget, ids),
      ),
    );
}

export async function softDeleteTables(ids: number[], userId: string) {
  await db
    .update(tableTable)
    .set({ deletedAt: new Date(), deletedBy: userId })
    .where(inArray(tableTable.id, ids));
}

export async function dropTables(workspace: string, rows: { id: number; tableName: string }[]) {
  const ids = rows.map((row) => row.id);
  const views = await db
    .select({ viewName: viewTable.viewName })
    .from(viewTable)
    .where(inArray(viewTable.tableId, ids));

  await db.batch([
    db.run(sql`pragma defer_foreign_keys = on`),
    ...views.map((view) =>
      db.run(sql.raw(buildDropView(physicalViewName(workspace, view.viewName)))),
    ),
    ...rows.map((row) =>
      db.run(sql.raw(buildDropTable(physicalTableName(workspace, row.tableName)))),
    ),
    db
      .delete(resourceTable)
      .where(
        inArray(
          resourceTable.id,
          db.select({ id: viewTable.id }).from(viewTable).where(inArray(viewTable.tableId, ids)),
        ),
      ),
    db.delete(resourceTable).where(inArray(resourceTable.id, ids)),
  ] as never);
}

export async function listDeletedTables(query: TrashQuery) {
  const pattern = query.q ? `%${query.q.replaceAll(/[\\%_]/g, "\\$&")}%` : null;
  const where = and(
    isNotNull(tableTable.deletedAt),
    pattern ? or(sql`${tableTable.name} like ${pattern} escape '\\'`) : undefined,
  );
  const sortExpression =
    query.sort === "name" ? sql`lower(${tableTable.name})` : tableTable.deletedAt;
  const direction = query.order === "desc" ? desc : asc;

  const [rows, [{ total }]] = await db.batch([
    db
      .select({
        id: tableTable.id,
        name: tableTable.name,
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

export async function findDeletedTable(id: number) {
  const [row] = await db
    .select()
    .from(tableTable)
    .where(and(eq(tableTable.id, id), isNotNull(tableTable.deletedAt)))
    .limit(1);
  return row as Table | undefined;
}

export async function findLinkedTableIds(tableId: number) {
  const links = await db
    .select({ options: columnTable.options })
    .from(columnTable)
    .where(
      and(
        eq(columnTable.tableId, tableId),
        eq(columnTable.format, "relation"),
        isNull(columnTable.deletedAt),
      ),
    );
  return [
    ...new Set(links.map((link) => Number((link.options as { tableId?: number }).tableId))),
  ].filter((target) => target !== tableId);
}

export async function findDeletedAmong(ids: number[]) {
  const [row] = await db
    .select({ name: tableTable.name })
    .from(tableTable)
    .where(and(inArray(tableTable.id, ids), isNotNull(tableTable.deletedAt)))
    .limit(1);
  return row;
}

export async function restoreTable(id: number) {
  await db
    .update(tableTable)
    .set({ deletedAt: null, deletedBy: null })
    .where(eq(tableTable.id, id));
}

async function listExpiredTables(cutoff: Date) {
  return db
    .select({ id: tableTable.id, tableName: tableTable.tableName })
    .from(tableTable)
    .where(and(isNotNull(tableTable.deletedAt), lt(tableTable.deletedAt, cutoff)));
}

async function findLinkTargetsFromOutside(ids: number[]) {
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
  return rows.map((row) => Number(row.target));
}

export async function purgeExpiredTables(workspace: string, cutoff: Date) {
  let doomed = await listExpiredTables(cutoff);

  for (let blocked = true; blocked && doomed.length > 0;) {
    const stuck = new Set(await findLinkTargetsFromOutside(doomed.map((row) => row.id)));
    blocked = stuck.size > 0;
    doomed = doomed.filter((row) => !stuck.has(row.id));
  }

  if (doomed.length > 0) await dropTables(workspace, doomed);
  return doomed.length;
}
