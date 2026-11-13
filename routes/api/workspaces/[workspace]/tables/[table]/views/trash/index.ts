import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { listDeletedViews } from "@/lib/views/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (_c, { params }) => ({
    rows: await listDeletedViews(params.table),
  })),
);
