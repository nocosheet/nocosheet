import { defineHandler } from "void";

import { requireAdmin } from "@/lib/auth/require-admin";
import { listDeletedTables } from "@/lib/tables/server";
import { resolveTrashQuery, trashSearchSchema } from "@/lib/trash/query";

export const GET = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ query: trashSearchSchema })(async (_c, { query }) =>
    listDeletedTables(resolveTrashQuery(query)),
  ),
);
