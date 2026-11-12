import { Link } from "@tanstack/react-router";

import { SettingsIcon } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** Pinned to the bottom of the sidebar, above the user menu. */
export function NavSecondary({ workspace }: { workspace: string }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="sm"
          tooltip="Settings"
          render={
            <Link
              to="/workspaces/$workspace/settings"
              params={{ workspace }}
              viewTransition={{ types: ["sidebar-forward"] }}
            />
          }
        >
          <SettingsIcon />
          <span>Settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
