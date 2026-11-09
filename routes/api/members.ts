import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { db, sql } from "void/db";

import { isAdmin } from "@/lib/roles";

type Member = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  createdAt: number | string;
  /** Admin-only: always null for everyone else. */
  banned: boolean | null;
  emailVerified: boolean | null;
};

/**
 * The workspace member directory: every account is a member, so this is the Better Auth user
 * table. Read-only and limited to signed-in users; ban and verification state are only sent to
 * admins.
 */
export const GET = defineHandler(async (c) => {
  const viewer = requireAuth(c);
  const rows = await db.all<Member>(sql`
    SELECT id, name, email, image, role, createdAt, banned, emailVerified
    FROM "user"
    ORDER BY name COLLATE NOCASE
    LIMIT 500
  `);

  if (isAdmin(viewer)) {
    return rows.map((row) => ({
      ...row,
      banned: Boolean(row.banned),
      emailVerified: Boolean(row.emailVerified),
    }));
  }
  return rows.map((row) => ({ ...row, banned: null, emailVerified: null }));
});
