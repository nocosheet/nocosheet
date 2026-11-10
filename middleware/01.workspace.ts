import { defineMiddleware } from "void";
import { requireAuth } from "void/auth";

import { DEFAULT_WORKSPACE } from "@/lib/workspace";

declare module "void" {
  interface CloudContextVariables {
    workspaceId: string;
  }
}

export default defineMiddleware(async (c, next) => {
  if (!c.req.path.startsWith("/api/w/")) return next();

  requireAuth(c);

  const workspaceId = c.req.path.split("/")[3];
  if (workspaceId !== DEFAULT_WORKSPACE) {
    return c.json({ error: "Workspace not found." }, 404);
  }

  c.set("workspaceId", workspaceId);
  return next();
});
