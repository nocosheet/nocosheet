import { Link } from "@tanstack/react-router";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePlaceholderTables } from "@/lib/placeholder-tables-store";

import { TableMenu } from "./table-menu";

export function NavTables({ workspace }: { workspace: string }) {
  const tables = usePlaceholderTables();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Tables</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {tables.map((table) => (
            <SidebarMenuItem key={table.id}>
              <SidebarMenuButton
                tooltip={table.name}
                isActive={false}
                render={<Link to="/w/$workspace/tables" params={{ workspace }} />}
              >
                <table.icon />
                <span>{table.name}</span>
              </SidebarMenuButton>
              <TableMenu table={table} workspace={workspace} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
