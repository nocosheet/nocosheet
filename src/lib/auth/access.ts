import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";

export const ac = createAccessControl(defaultStatements);

export const roles = {
  admin: ac.newRole(adminAc.statements),
  user: ac.newRole({ ...userAc.statements, user: ["list"] }),
};

export type Role = keyof typeof roles;

export const DEFAULT_ROLE: Role = "user";
export const ADMIN_ROLES: Role[] = ["admin"];

type Permissions = Parameters<(typeof roles)["admin"]["authorize"]>[0];
type MaybeUser = object | null | undefined;

const roleOf = (user: MaybeUser) =>
  ((user as { role?: string | null } | null | undefined)?.role ?? DEFAULT_ROLE) as Role;

export const hasPermission = (user: MaybeUser, permissions: Permissions) =>
  roles[roleOf(user)]?.authorize(permissions).success ?? false;

export const isAdmin = (user: MaybeUser) => ADMIN_ROLES.includes(roleOf(user));
