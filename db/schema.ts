import { sqliteTable, text } from "void/schema-d1";

import { userTable } from "../.void/better-auth-schema";

export const workspaceSchema = (workspaceId = "default") => ({
  settings: sqliteTable(`${workspaceId}__settings`, {
    userId: text("user_id")
      .primaryKey()
      .references(() => userTable.id, { onDelete: "cascade" }),
    metadata: text("metadata", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
  }),
});

export const { settings } = workspaceSchema();
