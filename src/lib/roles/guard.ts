import { httpError } from "../http";
import { type Access, loadAccess } from "./access";
import { type Action, type Scope } from "./permissions";

type User = { id: string; role?: string | null };

const DENIED: Record<Action, string> = {
  create: "You don't have permission to create records here.",
  read: "You don't have permission to view these records.",
  update: "You don't have permission to edit these records.",
  delete: "You don't have permission to delete these records.",
  export: "You don't have permission to export these records.",
};

export async function authorize(user: User, action: Action, tableId: number) {
  const access: Access = await loadAccess(user);
  const scope: Scope = access.scope(action, tableId);
  if (scope === "none") throw httpError(403, DENIED[action]);
  return { scope, ownerId: scope === "own" ? user.id : undefined };
}

export async function authorizeExport(user: User, tableId: number) {
  await authorize(user, "export", tableId);
  return authorize(user, "read", tableId);
}
