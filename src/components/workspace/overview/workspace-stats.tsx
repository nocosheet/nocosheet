import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Card, CardPanel } from "@/components/ui/card";
import { membersQueryOptions } from "@/data/workspace/members";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";
import { useAccess } from "@/hooks/use-access";
import { scopeLabel, summarizeGrants } from "@/lib/roles/matrix";

function Stat({
  label,
  value,
  hint,
  to,
  workspace,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  to: "/workspaces/$workspace/tables" | "/workspaces/$workspace/settings/members" | "/workspaces/$workspace/settings/role";
  workspace: string;
}) {
  return (
    <Card
      render={<Link to={to} params={{ workspace }} />}
      className="transition-colors hover:bg-accent/40"
    >
      <CardPanel className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
        <span className="truncate font-semibold text-2xl tabular-nums">{value}</span>
        <span className="truncate text-muted-foreground text-sm">{hint}</span>
      </CardPanel>
    </Card>
  );
}

export function WorkspaceStats({ workspace }: { workspace: string }) {
  const { data: members } = useSuspenseQuery(membersQueryOptions);
  const { data: sidebar } = useSuspenseQuery(sidebarQueryOptions(workspace));
  const access = useAccess();
  const tables = sidebar.groups.flatMap((group) => group.tables).length;
  const admins = members.filter((member) => member.role === "admin").length;
  const groups = sidebar.groups.filter((group) => group.name !== null).length;

  const can = summarizeGrants(access.grants)
    .filter((item) => item.scope !== "none")
    .map((item) => `${item.label.replace(" records", "")}${item.scope === "own" ? " (own)" : ""}`);

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <Stat
        label="Tables"
        value={tables}
        hint={groups > 0 ? `${groups} ${groups === 1 ? "group" : "groups"}` : "No groups"}
        to="/workspaces/$workspace/tables"
        workspace={workspace}
      />
      <Stat
        label="Members"
        value={members.length}
        hint={`${admins} ${admins === 1 ? "administrator" : "administrators"}`}
        to="/workspaces/$workspace/settings/members"
        workspace={workspace}
      />
      <Stat
        label="Your access"
        value={access.admin ? "Full access" : (access.role?.name ?? "No role")}
        hint={
          access.admin
            ? "Everything, including table structure"
            : can.length > 0
              ? can.join(", ")
              : scopeLabel("read", "none")
        }
        to="/workspaces/$workspace/settings/role"
        workspace={workspace}
      />
    </section>
  );
}
