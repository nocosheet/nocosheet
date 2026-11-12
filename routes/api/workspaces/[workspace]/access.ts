import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { loadAccess } from "@/lib/roles/access";

export const GET = defineHandler(async (c) => {
  const access = await loadAccess(requireAuth(c));
  return { admin: access.admin, role: access.role, grants: access.grants };
});
