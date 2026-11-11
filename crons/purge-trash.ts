import { defineScheduled } from "void";

import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { purgeExpiredTrashEntries } from "@/lib/records/trash-repository";
import { dropTables, findLinkTargetsFromOutside, listExpiredTables } from "@/lib/tables/repository";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export const cron = "0 3 * * *";

async function purgeExpiredTables(cutoff: Date) {
  let doomed = await listExpiredTables(cutoff);

  for (let blocked = true; blocked && doomed.length > 0;) {
    const stuck = new Set(await findLinkTargetsFromOutside(doomed.map((row) => row.id)));
    blocked = stuck.size > 0;
    doomed = doomed.filter((row) => !stuck.has(row.id));
  }

  if (doomed.length > 0) await dropTables(DEFAULT_WORKSPACE, doomed);
  return doomed.length;
}

export default defineScheduled(async () => {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const records = await purgeExpiredTrashEntries(cutoff);
  const tables = await purgeExpiredTables(cutoff);
  console.log(`Purged ${records} expired trash entries and ${tables} expired tables`);
});
