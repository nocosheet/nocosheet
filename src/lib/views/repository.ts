import { resourceTable, viewTable } from "@db/schema";
import { and, asc, count, db, desc, eq, inArray, isNotNull, isNull, lt, or, sql } from "void/db";

import { physicalTableName } from "../tables/naming";
import type { Column, Table } from "../tables/repository";
import type { TrashQuery } from "../trash/query";
import { buildCreateView, buildDropView } from "./ddl";
import { newViewName, physicalViewName } from "./naming";
import type { ViewsQuery } from "./query";
import type { ViewPatchValues, ViewValues } from "./validation";
import { buildViewWhere } from "./where";

export type View = typeof viewTable.$inferSelect;

export async function listViews(tableId: number) {
  return db
    .select()
    .from(viewTable)
    .where(and(eq(viewTable.tableId, tableId), isNull(viewTable.deletedAt)))
    .orderBy(asc(viewTable.position), asc(viewTable.id));
}

export async function listViewsPage(tableId: number, query: ViewsQuery) {
  const { page, pageSize, sort, order, q } = query;
  const pattern = q ? `%${q.replaceAll(/[\\%_]/g, "\\$&")}%` : null;

  const where = and(
    eq(viewTable.tableId, tableId),
    isNull(viewTable.deletedAt),
    pattern
      ? or(
          sql`${viewTable.name} like ${pattern} escape '\\'`,
          sql`${viewTable.description} like ${pattern} escape '\\'`,
        )
      : undefined,
  );

  const columnCount = sql<number>`json_array_length(${viewTable.selectColumns})`;
  const sortExpression = {
    name: sql`lower(${viewTable.name})`,
    columnCount,
    createdAt: viewTable.createdAt,
    updatedAt: viewTable.updatedAt,
  }[sort];
  const direction = order === "desc" ? desc : asc;

  const [rows, [{ total }]] = await db.batch([
    db
      .select({
        id: viewTable.id,
        name: viewTable.name,
        description: viewTable.description,
        icon: viewTable.icon,
        columnCount,
        createdAt: viewTable.createdAt,
        updatedAt: viewTable.updatedAt,
      })
      .from(viewTable)
      .where(where)
      .orderBy(direction(sortExpression), asc(viewTable.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(viewTable).where(where),
  ]);

  return { rows, total };
}

export async function findViews(tableId: number, ids: number[]) {
  return db
    .select({ id: viewTable.id, name: viewTable.name })
    .from(viewTable)
    .where(
      and(eq(viewTable.tableId, tableId), inArray(viewTable.id, ids), isNull(viewTable.deletedAt)),
    );
}

export async function softDeleteViews(ids: number[], userId: string) {
  await db
    .update(viewTable)
    .set({ deletedAt: new Date(), deletedBy: userId })
    .where(inArray(viewTable.id, ids));
}

export async function findView(tableId: number, id: number) {
  const [row] = await db
    .select()
    .from(viewTable)
    .where(and(eq(viewTable.tableId, tableId), eq(viewTable.id, id), isNull(viewTable.deletedAt)))
    .limit(1);
  return row;
}

export async function findDeletedView(tableId: number, id: number) {
  const [row] = await db
    .select()
    .from(viewTable)
    .where(
      and(eq(viewTable.tableId, tableId), eq(viewTable.id, id), isNotNull(viewTable.deletedAt)),
    )
    .limit(1);
  return row;
}

export async function findTrashedViewByName(tableId: number, name: string) {
  const [row] = await db
    .select({ name: viewTable.name })
    .from(viewTable)
    .where(
      and(
        eq(viewTable.tableId, tableId),
        sql`lower(${viewTable.name}) = lower(${name})`,
        isNotNull(viewTable.deletedAt),
      ),
    )
    .limit(1);
  return row;
}

export async function findViewsUsingColumn(tableId: number, columnName: string) {
  const views = await db.select().from(viewTable).where(eq(viewTable.tableId, tableId));
  return views.filter(
    (view) =>
      view.selectColumns.includes(columnName) || view.whereExpression?.includes(`"${columnName}"`),
  );
}

export async function createView(
  workspace: string,
  table: Table,
  columns: Column[],
  body: ViewValues,
  userId: string,
) {
  const viewName = newViewName();
  const selected = columns
    .filter((column) => body.selectColumns.includes(column.columnName))
    .map((column) => column.columnName);
  const where = buildViewWhere(columns, body.filters);

  const [, , inserted] = await db.batch([
    db.run(
      sql.raw(
        buildCreateView(
          physicalViewName(workspace, viewName),
          physicalTableName(workspace, table.tableName),
          selected,
          where,
        ),
      ),
    ),
    db.insert(resourceTable).values({ kind: "view" }),
    db
      .insert(viewTable)
      .values({
        id: sql`last_insert_rowid()`,
        tableId: table.id,
        viewName,
        name: body.name,
        description: body.description,
        icon: body.icon,
        type: "grid",
        position: sql`(select coalesce(max(position), -1) + 1 from ${viewTable} where ${viewTable.tableId} = ${table.id})`,
        selectColumns: selected,
        whereExpression: where,
        createdBy: userId,
      })
      .returning(),
  ]);
  return inserted[0];
}

export async function updateView(id: number, body: ViewPatchValues) {
  const [updated] = await db
    .update(viewTable)
    .set({
      name: body.name,
      description: body.description,
      icon: body.icon,
      updatedAt: new Date(),
    })
    .where(eq(viewTable.id, id))
    .returning();
  return updated;
}

export async function softDeleteView(id: number, userId: string) {
  await db
    .update(viewTable)
    .set({ deletedAt: new Date(), deletedBy: userId })
    .where(eq(viewTable.id, id));
}

export async function restoreView(id: number) {
  await db.update(viewTable).set({ deletedAt: null, deletedBy: null }).where(eq(viewTable.id, id));
}

export async function purgeView(workspace: string, view: Pick<View, "id" | "viewName">) {
  await db.batch([
    db.run(sql.raw(buildDropView(physicalViewName(workspace, view.viewName)))),
    db.delete(resourceTable).where(eq(resourceTable.id, view.id)),
  ]);
}

export async function purgeExpiredViews(workspace: string, cutoff: Date) {
  const expired = await db
    .select({ id: viewTable.id, viewName: viewTable.viewName })
    .from(viewTable)
    .where(and(isNotNull(viewTable.deletedAt), lt(viewTable.deletedAt, cutoff)));
  for (const view of expired) await purgeView(workspace, view);
  return expired.length;
}

export async function listDeletedViews(tableId: number, query: TrashQuery) {
  const pattern = query.q ? `%${query.q.replaceAll(/[\\%_]/g, "\\$&")}%` : null;
  const where = and(
    eq(viewTable.tableId, tableId),
    isNotNull(viewTable.deletedAt),
    pattern ? sql`${viewTable.name} like ${pattern} escape '\\'` : undefined,
  );
  const sortExpression =
    query.sort === "name" ? sql`lower(${viewTable.name})` : viewTable.deletedAt;
  const direction = query.order === "desc" ? desc : asc;

  const [rows, [{ total }]] = await db.batch([
    db
      .select({
        id: viewTable.id,
        name: viewTable.name,
        description: viewTable.description,
        icon: viewTable.icon,
        deletedAt: viewTable.deletedAt,
        deletedBy: viewTable.deletedBy,
        deletedByName: sql<
          string | null
        >`(select u."name" from "user" u where u."id" = ${viewTable.deletedBy})`,
      })
      .from(viewTable)
      .where(where)
      .orderBy(direction(sortExpression), asc(viewTable.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ total: count() }).from(viewTable).where(where),
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
