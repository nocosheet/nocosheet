import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";
import { dropTables, findDeletedTable, findLinkingColumns } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const table = await findDeletedTable(params.table);
    if (!table) throw httpError(404, "This table isn't in the trash.");

    const [link] = await findLinkingColumns([table.id], { liveOnly: false });
    if (link)
      throw httpError(
        409,
        `"${link.table}" still links to this table. Delete "${link.table}" forever first.`,
      );

    await dropTables(c.get("workspaceId"), [table]);
    return { ok: true };
  }),
);
