import {
  ACTIONS,
  type Action,
  actionOf,
  grantFor,
  isScopedAction,
  levelOf,
  PERMISSION_LABELS,
  type PermissionGrant,
  type Scope,
} from "./permissions";

export type Matrix = {
  workspace: Record<Action, Scope>;
  tables: Record<number, Partial<Record<Action, Scope>>>;
};

export function grantsToMatrix(grants: PermissionGrant[]): Matrix {
  const workspace = Object.fromEntries(
    ACTIONS.map((action) => [action, levelOf(grants, action, null) ?? "none"]),
  ) as Record<Action, Scope>;

  const tables: Matrix["tables"] = {};
  for (const grant of grants) {
    if (grant.resourceId === null) continue;
    const action = actionOf(grant.permission);
    const row = (tables[grant.resourceId] ??= {});
    row[action] = levelOf([grant], action, grant.resourceId) ?? "none";
  }

  return { workspace, tables };
}

export function matrixToGrants(matrix: Matrix): PermissionGrant[] {
  const grants: PermissionGrant[] = [];

  for (const action of ACTIONS) {
    const scope = matrix.workspace[action];
    if (scope !== "none") grants.push({ resourceId: null, permission: grantFor(action, scope) });
  }

  for (const [id, cells] of Object.entries(matrix.tables))
    for (const action of ACTIONS) {
      const scope = cells[action];
      if (scope !== undefined)
        grants.push({ resourceId: Number(id), permission: grantFor(action, scope) });
    }

  return grants;
}

export function scopeLabel(action: Action, scope: Scope) {
  if (!isScopedAction(action)) return scope === "none" ? "Not allowed" : "Allowed";
  return scope === "none" ? "None" : scope === "own" ? "Own records" : "All records";
}

export function summarizeGrants(grants: PermissionGrant[], resourceId: number | null = null) {
  return ACTIONS.map((action) => ({
    action,
    label: PERMISSION_LABELS[action],
    scope: levelOf(grants, action, resourceId) ?? "none",
  }));
}
