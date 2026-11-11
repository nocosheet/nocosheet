import { defineScheduled } from "void";

import { purgeExpiredTrash } from "@/lib/records/trash";
import { purgeExpiredTables } from "@/lib/tables/server";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export const cron = "0 3 * * *";

export default defineScheduled(async () => {
  const records = await purgeExpiredTrash();
  const tables = await purgeExpiredTables(DEFAULT_WORKSPACE);
  console.log(`Purged ${records} expired trash entries and ${tables} expired tables`);
});
