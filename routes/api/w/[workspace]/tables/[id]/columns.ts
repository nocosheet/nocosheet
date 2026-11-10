import { columnTable, tableTable } from "@db/schema";
import { HTTPException } from "hono/http-exception";
import { defineHandler } from "void";
import { and, db, eq, inArray, isNull, sql } from "void/db";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { buildAddColumn, columnSqliteType, DdlError, type RelationTarget } from "@/lib/tables/ddl";
import { physicalTableName, toColumnName } from "@/lib/tables/naming";
import { conflictOrBadRequest, findTable } from "@/lib/tables/server";
import { columnsInputSchema } from "@/lib/tables/validation";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: columnsInputSchema })(async (c, { params, body }) => {
    const workspace = c.get("workspaceId");
    const table = await findTable(params.id);
    const physicalName = physicalTableName(workspace, table.tableName);

    const targetIds = body.columns
      .filter((column) => column.format === "relation")
      .map((column) => Number(column.options.tableId));
    const targetRows = targetIds.length
      ? await db
          .select()
          .from(tableTable)
          .where(and(inArray(tableTable.id, targetIds), isNull(tableTable.deletedAt)))
      : [];
    const targets = new Map<number, RelationTarget>(
      targetRows.map((row) => [
        row.id,
        {
          physicalName: physicalTableName(workspace, row.tableName),
          idType: row.idType,
        },
      ]),
    );

    try {
      const [first, ...rest] = body.columns
        .flatMap((column) => buildAddColumn(physicalName, column, targets))
        .map((statement) => db.run(sql.raw(statement)));

      await db.batch([
        first,
        ...rest,
        ...body.columns.map((column) =>
          db.insert(columnTable).values({
            tableId: table.id,
            columnName: toColumnName(column.name),
            name: column.name,
            icon: column.icon,
            description: column.description,
            type: columnSqliteType(column, targets),
            format: column.format,
            options: column.options,
            isRequired: column.isRequired,
            isFilterable: column.isFilterable,
            isSortable: column.isSortable,
            isSearchable: column.isSearchable,
            isUnique: column.isUnique,
            isHidden: column.isHidden,
            defaultValue: column.defaultValue,
            checkExpression: column.checkExpression,
            generatedExpression: column.generatedExpression,
            position: column.position,
          }),
        ),
        ...(body.titleColumn
          ? [
              db
                .update(tableTable)
                .set({
                  titleColumnId: sql`(select ${columnTable.id} from ${columnTable} where ${columnTable.tableId} = ${table.id} and ${columnTable.columnName} = ${body.titleColumn})`,
                })
                .where(eq(tableTable.id, table.id)),
            ]
          : []),
      ]);
    } catch (error) {
      if (error instanceof DdlError) throw new HTTPException(400, { message: error.message });
      conflictOrBadRequest(error, "A column with this name already exists.");
    }

    return { ok: true };
  }),
);
