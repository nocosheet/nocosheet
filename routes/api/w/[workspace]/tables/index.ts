import { columnTable, resourceTable, tableTable } from "@db/schema";
import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { and, asc, count, db, desc, isNull, or, sql } from "void/db";

import { requireAdmin } from "@/lib/auth/require-admin";
import { buildCreateTable } from "@/lib/tables/ddl";
import { physicalTableName, toTableName } from "@/lib/tables/naming";
import { resolveTablesQuery, tablesSearchSchema } from "@/lib/tables/query";
import { conflictOrBadRequest, deleteTables } from "@/lib/tables/server";
import { tableInputSchema, tablesDeleteSchema } from "@/lib/tables/validation";

export const GET = defineHandler.withValidator({ query: tablesSearchSchema })(async (
  _c,
  { query },
) => {
  const { page, pageSize, sort, order, q } = resolveTablesQuery(query);

  const columnCount = sql<number>`(select count(*) from ${columnTable} where ${columnTable.tableId} = ${tableTable}.id and ${columnTable.deletedAt} is null)`;
  const pattern = q ? `%${q.replaceAll(/[\\%_]/g, "\\$&")}%` : null;

  const where = and(
    isNull(tableTable.deletedAt),
    pattern
      ? or(
          sql`${tableTable.name} like ${pattern} escape '\\'`,
          sql`${tableTable.tableName} like ${pattern} escape '\\'`,
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
        tableName: tableTable.tableName,
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
});

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ body: tableInputSchema })(async (c, { body }) => {
    const user = requireAuth(c);
    const workspace = c.get("workspaceId");
    const tableName = toTableName(body.name);
    const physicalName = physicalTableName(workspace, tableName);
    const createTable = buildCreateTable({ ...body, physicalName });

    try {
      const [, , inserted] = await db.batch([
        db.run(sql.raw(createTable)),
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
            hasCreatedAt: body.hasCreatedAt,
            hasCreatedBy: body.hasCreatedBy,
            hasUpdatedAt: body.hasUpdatedAt,
            hasUpdatedBy: body.hasUpdatedBy,
            position: sql`(select coalesce(max(position), -1) + 1 from ${tableTable})`,
            createdBy: user.id,
          })
          .returning(),
      ]);
      return inserted[0];
    } catch (error) {
      conflictOrBadRequest(error, "A table with this name already exists.");
    }
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ body: tablesDeleteSchema })(async (c, { body }) => {
    await deleteTables(c.get("workspaceId"), body.ids);
    return { ok: true };
  }),
);
