import { columnTable, tableTable } from "@db/schema";
import { HTTPException } from "hono/http-exception";
import { defineHandler } from "void";
import { and, asc, db, eq, isNull } from "void/db";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { TITLE_FORMATS } from "@/lib/tables/formats";
import { conflictOrBadRequest, defined, findTable } from "@/lib/tables/server";
import { tableUpdateSchema } from "@/lib/tables/validation";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (_c, { params }) => {
  const table = await findTable(params.id);
  const tableColumns = await db
    .select()
    .from(columnTable)
    .where(and(eq(columnTable.tableId, table.id), isNull(columnTable.deletedAt)))
    .orderBy(asc(columnTable.position));
  return { ...table, columns: tableColumns };
});

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: tableUpdateSchema })(async (c, { params, body }) => {
    const table = await findTable(params.id);
    const { titleColumn, ...fields } = body;

    let titleColumnId: number | null | undefined;
    if (titleColumn === null) titleColumnId = null;
    else if (titleColumn !== undefined) {
      const [match] = await db
        .select()
        .from(columnTable)
        .where(
          and(
            eq(columnTable.tableId, table.id),
            eq(columnTable.columnName, titleColumn),
            isNull(columnTable.deletedAt),
          ),
        )
        .limit(1);
      if (!match || !TITLE_FORMATS.includes(match.format as never))
        throw new HTTPException(400, { message: "Pick a column that can be used as the title." });
      titleColumnId = match.id;
    }

    try {
      const [updated] = await db
        .update(tableTable)
        .set({ ...defined({ ...fields, titleColumnId }), updatedAt: new Date() })
        .where(eq(tableTable.id, table.id))
        .returning();
      return updated;
    } catch (error) {
      conflictOrBadRequest(error, "A table with this name already exists.");
    }
  }),
);
