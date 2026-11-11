import { useSuspenseQuery } from "@tanstack/react-query";

import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";
import { useAccess } from "@/hooks/use-access";
import { scopeLabel, summarizeGrants } from "@/lib/roles/matrix";

export function YourRole({ workspace }: { workspace: string }) {
  const access = useAccess();
  const { data: sidebar } = useSuspenseQuery(sidebarQueryOptions(workspace));
  const tables = sidebar.groups.flatMap((group) => group.tables);
  const overridden = tables.filter((table) =>
    access.grants.some((grant) => grant.resourceId === table.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Your role</CardFrameTitle>
          <CardFrameDescription>
            {access.admin
              ? "You are an administrator. You can do everything, including changing table structure."
              : (access.role?.description ?? "What you can do with records in this workspace.")}
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <SettingsRow
            title={access.admin ? "Administrator" : (access.role?.name ?? "No role")}
            description={
              access.admin
                ? "Roles don't apply to administrators."
                : "Ask an administrator if you need different access."
            }
            badge={
              <Badge variant={access.admin ? "info" : "secondary"} size="sm">
                {access.admin ? "Full access" : "Your role"}
              </Badge>
            }
          />
          {!access.admin &&
            summarizeGrants(access.grants).map((item) => (
              <SettingsRow key={item.action} title={item.label} description="In every table">
                <span className="text-sm">{scopeLabel(item.action, item.scope)}</span>
              </SettingsRow>
            ))}
        </Card>
      </CardFrame>
      {!access.admin && overridden.length > 0 && (
        <CardFrame>
          <CardFrameHeader>
            <CardFrameTitle>Table differences</CardFrameTitle>
            <CardFrameDescription>Tables where your permissions differ.</CardFrameDescription>
          </CardFrameHeader>
          <Card>
            {overridden.map((table) => (
              <SettingsRow
                key={table.id}
                title={table.name}
                description={summarizeGrants(access.grants, table.id)
                  .map((item) => `${item.label}: ${scopeLabel(item.action, item.scope)}`)
                  .join(" · ")}
              />
            ))}
          </Card>
        </CardFrame>
      )}
    </div>
  );
}
