/** Roles come back as a comma-separated string when a user holds several. */
export function hasRole(user: object | null | undefined, role: string) {
  const roles = (user as { role?: string | null } | null | undefined)?.role;
  return Boolean(
    roles
      ?.split(",")
      .map((value) => value.trim())
      .includes(role),
  );
}

export const isAdmin = (user: object | null | undefined) => hasRole(user, "admin");
