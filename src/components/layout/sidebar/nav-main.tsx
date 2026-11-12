import { Link } from "@tanstack/react-router";

import { HomeIcon, SparklesIcon, TableIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { toastManager } from "@/components/ui/toast";
import { useIsActivePath } from "@/hooks/use-is-active-path";

import { SearchDialog } from "./search-dialog";

/** Search, Ask AI, Home and All tables: the always-visible entries at the top of the sidebar. */
export function NavMain({ workspace }: { workspace: string }) {
  const isActive = useIsActivePath();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SearchDialog workspace={workspace} />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Ask AI"
              onClick={() =>
                toastManager.add({
                  type: "info",
                  title: "Ask AI is coming soon",
                  description: "Ask questions about your tables in plain language.",
                })
              }
            >
              <SparklesIcon />
              <span>Ask AI</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Home"
              isActive={isActive(`/workspaces/${workspace}`, true)}
              render={<Link to="/workspaces/$workspace" params={{ workspace }} />}
            >
              <HomeIcon />
              <span>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="All tables"
              isActive={
                isActive(`/workspaces/${workspace}/tables`, true) || isActive(`/workspaces/${workspace}/tables/new`)
              }
              render={<Link to="/workspaces/$workspace/tables" params={{ workspace }} />}
            >
              <TableIcon />
              <span>All tables</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
