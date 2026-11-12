import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { loadAccess } from "@/lib/roles/access";
import { listSidebarRows } from "@/lib/tables/repository";

export const GET = defineHandler(async (c) => {
  const user = requireAuth(c);
  const [access, rows] = await Promise.all([loadAccess(user), listSidebarRows(user.id)]);
  return rows.filter((row) => access.scope("read", row.id) !== "none");
});
