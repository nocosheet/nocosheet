import { db, sql } from "void/db";

export async function hasUsers() {
  try {
    const rows = await db.all<{ count: number }>(sql`SELECT COUNT(*) AS count FROM "user"`);
    return Number(rows[0]?.count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function findUserById(id: string) {
  const [row] = await db.all<{ id: string; name: string; role: string | null }>(
    sql`SELECT "id", "name", "role" FROM "user" WHERE "id" = ${id} LIMIT 1`,
  );
  return row;
}
