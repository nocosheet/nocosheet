import { z } from "zod";

import { actionOf, PERMISSIONS } from "./permissions";

export const grantSchema = z.object({
  resourceId: z.number().int().positive().nullable(),
  permission: z.enum(PERMISSIONS),
});

const grantsSchema = z
  .array(grantSchema)
  .max(500)
  .refine((grants) => {
    const seen = new Set<string>();
    for (const grant of grants) {
      const key = `${grant.resourceId ?? 0}:${actionOf(grant.permission)}`;
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  }, "Each action can only be set once per table");

const roleName = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(64, "Name must be 64 characters or fewer");

const roleDescription = z
  .string()
  .trim()
  .max(300, "Description must be 300 characters or fewer")
  .nullable()
  .optional();

export const roleCreateSchema = z.object({
  name: roleName,
  description: roleDescription,
  grants: grantsSchema.default([]),
});

export const roleUpdateSchema = z.object({
  name: roleName.optional(),
  description: roleDescription,
  isDefault: z.boolean().optional(),
  grants: grantsSchema.optional(),
});

export const roleAssignSchema = z.object({
  userId: z.string().min(1).max(64),
  roleId: z.number().int().positive(),
});

export type RoleCreateInput = z.input<typeof roleCreateSchema>;
export type RoleUpdateInput = z.input<typeof roleUpdateSchema>;
