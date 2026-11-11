import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { listTrash } from "@/lib/records/trash";
import { findTable } from "@/lib/tables/server";
import { resolveTrashQuery, trashSearchSchema } from "@/lib/trash/query";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const GET = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, query: trashSearchSchema })(
    async (_c, { params, query }) => {
      const table = await findTable(params.id);
      return listTrash(table, resolveTrashQuery(query));
    },
  ),
);
