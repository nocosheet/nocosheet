import { defineHandler } from "void";
import { z } from "zod";

import { loadExportRecords } from "@/lib/records/server";
import { findTable } from "@/lib/tables/server";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const table = await findTable(params.id);
  return loadExportRecords(c.get("workspaceId"), table);
});
