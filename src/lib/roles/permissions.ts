export const ACTIONS = ["create", "read", "update", "delete", "export"] as const;
export type Action = (typeof ACTIONS)[number];

export const SCOPES = ["none", "own", "all"] as const;
export type Scope = (typeof SCOPES)[number];

export const PERMISSIONS = [
  "create",
  "create:none",
  "export",
  "export:none",
  "read:own",
  "read:all",
  "read:none",
  "update:own",
  "update:all",
  "update:none",
  "delete:own",
  "delete:all",
  "delete:none",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type PermissionGrant = { resourceId: number | null; permission: Permission };

export const actionOf = (permission: Permission) => permission.split(":")[0] as Action;

export const SCOPED_ACTIONS = ["read", "update", "delete"] as const;
export const FLAG_ACTIONS = ["create", "export"] as const;

export const isScopedAction = (action: Action): action is (typeof SCOPED_ACTIONS)[number] =>
  (SCOPED_ACTIONS as readonly string[]).includes(action);

export function levelOf(
  grants: PermissionGrant[],
  action: Action,
  resourceId: number | null,
): Scope | undefined {
  const find = (id: number | null) =>
    grants.find((grant) => grant.resourceId === id && actionOf(grant.permission) === action);
  const grant = (resourceId !== null ? find(resourceId) : undefined) ?? find(null);
  if (!grant) return undefined;
  if (isScopedAction(action)) return grant.permission.split(":")[1] as Scope;
  return grant.permission.endsWith(":none") ? "none" : "all";
}

export const scopeOf = (grants: PermissionGrant[], action: Action, resourceId: number | null) =>
  levelOf(grants, action, resourceId) ?? "none";

export const PERMISSION_LABELS: Record<Action, string> = {
  create: "Create records",
  read: "View records",
  update: "Edit records",
  delete: "Delete records",
  export: "Export records",
};

export const grantFor = (action: Action, scope: Scope): Permission =>
  (isScopedAction(action)
    ? `${action}:${scope}`
    : scope === "none"
      ? `${action}:none`
      : action) as Permission;
