import { defineHandler } from "void";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";
import {
  createRole,
  findRoleByName,
  findRoleWithGrants,
  listRolesWithGrants,
  replaceGrants,
} from "@/lib/roles/repository";
import { roleCreateSchema } from "@/lib/roles/validation";
import { findTables } from "@/lib/tables/repository";

export const GET = defineHandler(requireAdmin, async () => listRolesWithGrants());

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ body: roleCreateSchema })(async (_c, { body }) => {
    if (await findRoleByName(body.name))
      throw httpError(409, `A role named "${body.name}" already exists.`);

    const tableIds = [
      ...new Set(body.grants.flatMap((grant) => (grant.resourceId ? [grant.resourceId] : []))),
    ];
    if (tableIds.length > 0 && (await findTables(tableIds)).length !== tableIds.length)
      throw httpError(400, "A table in the permissions no longer exists.");

    const role = await createRole({ name: body.name, description: body.description });
    if (body.grants.length > 0) await replaceGrants(role.id, body.grants);
    return findRoleWithGrants(role.id);
  }),
);
