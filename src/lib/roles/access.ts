import { isAdmin } from "../auth/access";
import { type Action, type PermissionGrant, type Scope, scopeOf } from "./permissions";
import { findUserRole, listGrantsForRole } from "./repository";

export type Access = {
  admin: boolean;
  role: { id: number; name: string; description: string | null } | null;
  grants: PermissionGrant[];
  scope: (action: Action, resourceId: number | null) => Scope;
};

export async function loadAccess(user: { id: string; role?: string | null }): Promise<Access> {
  if (isAdmin(user)) return { admin: true, role: null, grants: [], scope: () => "all" };

  const role = await findUserRole(user.id);
  const grants = role ? await listGrantsForRole(role.id) : [];
  return {
    admin: false,
    role: role ? { id: role.id, name: role.name, description: role.description } : null,
    grants,
    scope: (action, resourceId) => scopeOf(grants, action, resourceId),
  };
}
