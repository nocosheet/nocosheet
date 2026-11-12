import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { resolveTrashQuery, trashSearchSchema } from "@/lib/trash/query";
import { listDeletedViews } from "@/lib/views/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, query: trashSearchSchema })(async (_c, { params, query }) =>
    listDeletedViews(params.table, resolveTrashQuery(query)),
  ),
);
