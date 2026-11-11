import { Badge } from "@/components/ui/badge";
import { summarizeGrants } from "@/lib/roles/matrix";
import { PERMISSION_LABELS, type PermissionGrant, type Scope } from "@/lib/roles/permissions";

const SHORT: Record<string, string> = {
  create: "Create",
  read: "View",
  update: "Edit",
  delete: "Delete",
  export: "Export",
};

const SCOPE_SHORT: Record<Scope, string> = { none: "", own: " (own)", all: "" };

export function RoleSummary({ grants }: { grants: PermissionGrant[] }) {
  const items = summarizeGrants(grants).filter((item) => item.scope !== "none");
  const overrides = new Set(
    grants.filter((grant) => grant.resourceId !== null).map((g) => g.resourceId),
  ).size;

  if (items.length === 0 && overrides === 0)
    return <span className="text-muted-foreground text-sm">No permissions</span>;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => (
        <Badge
          key={item.action}
          variant="secondary"
          size="sm"
          title={PERMISSION_LABELS[item.action]}
        >
          {SHORT[item.action]}
          {SCOPE_SHORT[item.scope]}
        </Badge>
      ))}
      {overrides > 0 && (
        <Badge variant="outline" size="sm">
          {overrides} table {overrides === 1 ? "override" : "overrides"}
        </Badge>
      )}
    </div>
  );
}
