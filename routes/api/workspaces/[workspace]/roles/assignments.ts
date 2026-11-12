import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { isAdmin } from "@/lib/auth/access";
import { findUserById } from "@/lib/auth/repository";
import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";
import { assignRole, findRole, listAssignments } from "@/lib/roles/repository";
import { roleAssignSchema } from "@/lib/roles/validation";

export const GET = defineHandler(requireAdmin, async () => listAssignments());

export const PUT = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ body: roleAssignSchema })(async (c, { body }) => {
    const member = await findUserById(body.userId);
    if (!member) throw httpError(404, "Member not found.");
    if (isAdmin(member))
      throw httpError(400, "Administrators have full access. Roles apply to members only.");

    const role = await findRole(body.roleId);
    if (!role) throw httpError(404, "Role not found.");

    await assignRole(member.id, role.id, requireAuth(c).id);
    return { userId: member.id, roleId: role.id };
  }),
);
