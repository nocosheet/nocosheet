import { defineHandler } from "void";
import { db, sql } from "void/db";

/** Public on purpose: the sign-in/sign-up pages need to know whether first-run setup is pending. */
export const GET = defineHandler(async () => {
  try {
    const rows = await db.all<{ count: number }>(sql`SELECT COUNT(*) AS count FROM "user"`);
    return { needsSetup: Number(rows[0]?.count ?? 0) === 0 };
  } catch {
    // Auth tables are created lazily on the first auth request, so a missing table means no users yet.
    return { needsSetup: true };
  }
});
