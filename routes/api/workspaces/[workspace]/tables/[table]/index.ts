import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { TITLE_FORMATS } from "@/lib/tables/formats";
import {
  findColumnByName,
  findTable,
  listColumns,
  updateTable,
} from "@/lib/tables/repository";
import { tableUpdateSchema } from "@/lib/tables/validation";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (_c, { params }) => {
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  return { ...table, columns: await listColumns(table.id) };
});

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: tableUpdateSchema })(async (c, { params, body }) => {
    const table = await findTable(params.table);
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

    try {
      return await updateTable(table.id, { ...fields, titleColumnId });
    } catch (error) {
      conflictOrBadRequest(error, "A table with this name already exists.");
    }
  }),
);
