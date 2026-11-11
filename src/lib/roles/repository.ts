import { roleMemberTable, rolePermissionTable, roleTable } from "@db/schema";
import { and, asc, count, db, desc, eq, sql } from "void/db";

import type { PermissionGrant } from "./permissions";

export type Role = typeof roleTable.$inferSelect;

const INSERT_CHUNK = 30;

const roleWithGrants = {
  id: roleTable.id,
  name: roleTable.name,
  description: roleTable.description,
  isSystem: roleTable.isSystem,
  isDefault: roleTable.isDefault,
  position: roleTable.position,
  memberCount: sql<number>`(select count(*) from ${roleMemberTable} m where m.role_id = ${roleTable}.id)`,
  grants: sql<string>`(select json_group_array(json_object('resourceId', p.resource_id, 'permission', p.permission)) from ${rolePermissionTable} p where p.role_id = ${roleTable}.id)`,
};

const withParsedGrants = <T extends { grants: string }>(row: T) => ({
  ...row,
  grants: JSON.parse(row.grants) as PermissionGrant[],
});

export async function listRolesWithGrants() {
  const rows = await db
    .select(roleWithGrants)
    .from(roleTable)
    .orderBy(asc(roleTable.position), asc(roleTable.id));
  return rows.map(withParsedGrants);
}

export async function findRoleWithGrants(id: number) {
  const [row] = await db
    .select(roleWithGrants)
    .from(roleTable)
    .where(eq(roleTable.id, id))
    .limit(1);
  return row ? withParsedGrants(row) : undefined;
}

export async function findRole(id: number) {
  const [row] = await db.select().from(roleTable).where(eq(roleTable.id, id)).limit(1);
  return row as Role | undefined;
}

export async function findRoleByName(name: string) {
  const [row] = await db
    .select()
    .from(roleTable)
    .where(sql`lower(${roleTable.name}) = lower(${name})`)
    .limit(1);
  return row as Role | undefined;
}

export async function findDefaultRole() {
  const [row] = await db.select().from(roleTable).where(eq(roleTable.isDefault, true)).limit(1);
  return row as Role | undefined;
}

export async function nextRolePosition() {
  const [row] = await db
    .select({ position: roleTable.position })
    .from(roleTable)
    .orderBy(desc(roleTable.position))
    .limit(1);
  return (row?.position ?? -1) + 1;
}

export async function createRole(values: { name: string; description?: string | null }) {
  const [created] = await db
    .insert(roleTable)
    .values({
      name: values.name,
      description: values.description ?? null,
      position: await nextRolePosition(),
    })
    .returning();
  return created;
}

export async function updateRole(
  id: number,
  values: { name?: string; description?: string | null },
) {
  const [updated] = await db
    .update(roleTable)
    .set({
      ...(values.name !== undefined ? { name: values.name } : {}),
      ...(values.description !== undefined ? { description: values.description } : {}),
      updatedAt: new Date(),
    })
    .where(eq(roleTable.id, id))
    .returning();
  return updated;
}

export async function makeDefaultRole(id: number) {
  await db.batch([
    db.update(roleTable).set({ isDefault: false }).where(eq(roleTable.isDefault, true)),
    db
      .update(roleTable)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(roleTable.id, id)),
  ]);
}

export async function deleteRole(id: number) {
  await db.delete(roleTable).where(eq(roleTable.id, id));
}

export async function countRoleMembers(roleId: number) {
  const [row] = await db
    .select({ total: count() })
    .from(roleMemberTable)
    .where(eq(roleMemberTable.roleId, roleId));
  return row?.total ?? 0;
}

export async function replaceGrants(roleId: number, grants: PermissionGrant[]) {
  const inserts = [];
  for (let start = 0; start < grants.length; start += INSERT_CHUNK)
    inserts.push(
      db.insert(rolePermissionTable).values(
        grants.slice(start, start + INSERT_CHUNK).map((grant) => ({
          roleId,
          resourceId: grant.resourceId,
          permission: grant.permission,
        })),
      ),
    );

  await db.batch([
    db.delete(rolePermissionTable).where(eq(rolePermissionTable.roleId, roleId)),
    db.update(roleTable).set({ updatedAt: new Date() }).where(eq(roleTable.id, roleId)),
    ...inserts,
  ] as never);
}

export async function listAssignments() {
  return db
    .select({ userId: roleMemberTable.userId, roleId: roleMemberTable.roleId })
    .from(roleMemberTable);
}

export async function assignRole(userId: string, roleId: number, assignedBy: string) {
  await db
    .insert(roleMemberTable)
    .values({ userId, roleId, assignedBy })
    .onConflictDoUpdate({
      target: roleMemberTable.userId,
      set: { roleId, assignedBy, assignedAt: new Date() },
    });
}

export async function findUserRole(userId: string) {
  const [assigned] = await db
    .select({ roleId: roleMemberTable.roleId })
    .from(roleMemberTable)
    .where(eq(roleMemberTable.userId, userId))
    .limit(1);
  if (assigned) return findRole(assigned.roleId);
  return findDefaultRole();
}

export async function listGrantsForRole(roleId: number) {
  const rows = await db
    .select({
      resourceId: rolePermissionTable.resourceId,
      permission: rolePermissionTable.permission,
    })
    .from(rolePermissionTable)
    .where(and(eq(rolePermissionTable.roleId, roleId)));
  return rows as PermissionGrant[];
}
