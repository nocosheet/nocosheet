import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { TITLE_FORMATS } from "@/lib/tables/formats";
import {
  findColumnByName,
  findTable,
  findTrashedTableByName,
  listColumns,
  updateTable,
} from "@/lib/tables/repository";
import { tableUpdateSchema } from "@/lib/tables/validation";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (_c, { params }) => {
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");
  return { ...table, columns: await listColumns(table.id) };
});

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: tableUpdateSchema })(async (c, { params, body }) => {
    const table = await findTable(params.id);
    if (!table) throw httpError(404, "Table not found.");
    const { titleColumn, ...fields } = body;

    let titleColumnId: number | null | undefined;
    if (titleColumn === null) titleColumnId = null;
    else if (titleColumn !== undefined) {
      const match = await findColumnByName(table.id, titleColumn);
      if (!match || !TITLE_FORMATS.includes(match.format as never))
        throw httpError(400, "Pick a column that can be used as the title.");
      titleColumnId = match.id;
    }

    if (fields.name !== undefined && fields.name !== table.name) {
      const trashed = await findTrashedTableByName(fields.name);
      if (trashed)
        throw httpError(
          409,
          `A deleted table named "${trashed.name}" is still in the trash. Restore it or delete it forever from the trash first.`,
        );
    }

    try {
      return await updateTable(table.id, { ...fields, titleColumnId });
    } catch (error) {
      conflictOrBadRequest(error, "A table with this name already exists.");
    }
  }),
);
