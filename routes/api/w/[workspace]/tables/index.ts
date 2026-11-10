import { resourceTable, tableTable } from "@db/schema";
import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { asc, db, isNull, sql } from "void/db";

import { requireAdmin } from "@/lib/auth/require-admin";
import { buildCreateTable } from "@/lib/tables/ddl";
import { physicalTableName, toTableName } from "@/lib/tables/naming";
import { conflictOrBadRequest } from "@/lib/tables/server";
import { tableInputSchema } from "@/lib/tables/validation";

export const GET = defineHandler(() =>
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
      position: tableTable.position,
    })
    .from(tableTable)
    .where(isNull(tableTable.deletedAt))
    .orderBy(asc(tableTable.position)),
);

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
