import { defineMiddleware } from "void";
import { requireAuth } from "void/auth";

import { isAdmin } from "./access";

export const requireAdmin = defineMiddleware(async (c, next) => {
  if (!isAdmin(requireAuth(c))) return c.json({ error: "Admin access required." }, 403);
  return next();
});
