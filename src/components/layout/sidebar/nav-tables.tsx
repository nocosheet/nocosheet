import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { PlusIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NamedIcon } from "@/components/workspace/tables/named-icon";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";
import { useWorkspace } from "@/hooks/use-workspace";

import { TableMenu } from "./table-menu";

export function NavTables({ workspace }: { workspace: string }) {
  const { data } = useSuspenseQuery(sidebarQueryOptions(workspace));
  const { isAdmin } = useWorkspace();

  if (data.groups.length === 0) {
    if (!isAdmin) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Tables</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="New table"
                className="text-sidebar-foreground/70"
                render={
                  <Link to="/w/$workspace/tables/new" params={{ workspace }} search={{ step: 1 }} />
                }
              >
                <PlusIcon />
                <span>New table</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return data.groups.map((group) => (
    <SidebarGroup key={group.name ?? "__ungrouped__"}>
      <SidebarGroupLabel>{group.name ?? "Tables"}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.tables.map((table) => (
            <SidebarMenuItem key={table.id}>
              <SidebarMenuButton
                tooltip={table.name}
                render={<Link to="/w/$workspace/tables" params={{ workspace }} />}
              >
                <NamedIcon name={table.icon} />
                <span>{table.name}</span>
              </SidebarMenuButton>
              <TableMenu table={table} workspace={workspace} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
