import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { purgeDeletedTable } from "@/lib/tables/server";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    await purgeDeletedTable(c.get("workspaceId"), params.id);
    return { ok: true };
  }),
);
