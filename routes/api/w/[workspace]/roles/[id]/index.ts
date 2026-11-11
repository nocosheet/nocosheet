import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import {
  countRoleMembers,
  deleteRole,
  findRole,
  findRoleByName,
  findRoleWithGrants,
  makeDefaultRole,
  replaceGrants,
  updateRole,
} from "@/lib/roles/repository";
import { roleUpdateSchema } from "@/lib/roles/validation";
import { findTables } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const GET = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (_c, { params }) => {
    const role = await findRoleWithGrants(params.id);
    if (!role) throw httpError(404, "Role not found.");
    return role;
  }),
);

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: roleUpdateSchema })(async (_c, { params, body }) => {
    const role = await findRole(params.id);
    if (!role) throw httpError(404, "Role not found.");

    if (body.name !== undefined && body.name !== role.name) {
      if (role.isSystem) throw httpError(400, "Built-in roles can't be renamed.");
      const existing = await findRoleByName(body.name);
      if (existing && existing.id !== role.id)
        throw httpError(409, `A role named "${body.name}" already exists.`);
    }
    if (body.isDefault === false && role.isDefault)
      throw httpError(400, "Make another role the default instead.");

    if (body.grants) {
      const tableIds = [
        ...new Set(body.grants.flatMap((grant) => (grant.resourceId ? [grant.resourceId] : []))),
      ];
      if (tableIds.length > 0 && (await findTables(tableIds)).length !== tableIds.length)
        throw httpError(400, "A table in the permissions no longer exists.");
    }

    try {
      if (body.name !== undefined || body.description !== undefined)
        await updateRole(role.id, { name: body.name, description: body.description });
      if (body.grants) await replaceGrants(role.id, body.grants);
      if (body.isDefault) await makeDefaultRole(role.id);
    } catch (error) {
      conflictOrBadRequest(error, `A role named "${body.name}" already exists.`);
    }

    return findRoleWithGrants(role.id);
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (_c, { params }) => {
    const role = await findRole(params.id);
    if (!role) throw httpError(404, "Role not found.");
    if (role.isSystem) throw httpError(400, "Built-in roles can't be deleted.");
    if (role.isDefault)
      throw httpError(400, "This is the default role. Make another role the default first.");

    const members = await countRoleMembers(role.id);
    if (members > 0)
      throw httpError(
        409,
        `${members} ${members === 1 ? "member has" : "members have"} this role. Give ${members === 1 ? "them" : "them"} another role first.`,
      );

    try {
      await deleteRole(role.id);
    } catch (error) {
      conflictOrBadRequest(error, "This role is still assigned to members.");
    }
    return { ok: true };
  }),
);
