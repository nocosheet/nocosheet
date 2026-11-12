import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";
import { listTrash } from "@/lib/records/trash-repository";
import { findTable } from "@/lib/tables/repository";
import { resolveTrashQuery, trashSearchSchema } from "@/lib/trash/query";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, query: trashSearchSchema })(
    async (_c, { params, query }) => {
      const table = await findTable(params.table);
      if (!table) throw httpError(404, "Table not found.");
      return listTrash(table, resolveTrashQuery(query));
    },
  ),
);
