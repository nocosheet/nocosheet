import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { ChevronUpIcon, MoreHorizontalIcon } from "lucide-react";

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

const VISIBLE = 3;

export function NavFavorites({ workspace }: { workspace: string }) {
  const [expanded, setExpanded] = useState(false);
  const favorites = usePlaceholderTables().filter((table) => table.favorite);
  const visible = expanded ? favorites : favorites.slice(0, VISIBLE);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Favorites</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map((table) => (
            <SidebarMenuItem key={table.id}>
              <SidebarMenuButton
                tooltip={table.name}
                render={<Link to="/w/$workspace/tables" params={{ workspace }} />}
              >
                <table.icon />
                <span>{table.name}</span>
              </SidebarMenuButton>
              <TableMenu table={table} workspace={workspace} />
            </SidebarMenuItem>
          ))}
          {favorites.length > VISIBLE && (
            <SidebarMenuItem>
              <SidebarMenuButton
                className="text-sidebar-foreground/70"
                tooltip={expanded ? "Show less" : "More"}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? <ChevronUpIcon /> : <MoreHorizontalIcon />}
                <span>{expanded ? "Less" : "More"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
