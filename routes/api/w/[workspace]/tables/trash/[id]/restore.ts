import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { restoreTable } from "@/lib/tables/server";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (_c, { params }) => restoreTable(params.id)),
);
