import { Link } from "@tanstack/react-router";

import {
  CreditCardIcon,
  DatabaseBackupIcon,
  KeyRoundIcon,
  PaletteIcon,
  PlugIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useIsActivePath } from "@/hooks/use-is-active-path";

const groups = [
  {
    label: "Workspace",
    items: [
      {
        to: "/workspaces/$workspace/settings",
        label: "General",
        icon: SlidersHorizontalIcon,
        path: "",
        exact: true,
      },
      { to: "/workspaces/$workspace/settings/members", label: "Members", icon: UsersIcon, path: "/members" },
      {
        to: "/workspaces/$workspace/settings/role",
        label: "Role & Permissions",
        icon: ShieldCheckIcon,
        path: "/role",
      },
      {
        to: "/workspaces/$workspace/settings/billing",
        label: "Billing",
        icon: CreditCardIcon,
        path: "/billing",
      },
      {
        to: "/workspaces/$workspace/settings/appearance",
        label: "Appearance",
        icon: PaletteIcon,
        path: "/appearance",
      },
    ],
  },
  {
    label: "Data & integrations",
    items: [
      { to: "/workspaces/$workspace/settings/data", label: "Data", icon: DatabaseBackupIcon, path: "/data" },
      {
        to: "/workspaces/$workspace/settings/integrations",
        label: "Integrations",
        icon: PlugIcon,
        path: "/integrations",
      },
      { to: "/workspaces/$workspace/settings/api", label: "API", icon: KeyRoundIcon, path: "/api" },
    ],
  },
] as const;

export function NavSettings({ workspace }: { workspace: string }) {
  const isActive = useIsActivePath();

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={isActive(
                      `/workspaces/${workspace}/settings${item.path}`,
                      "exact" in item && item.exact,
                    )}
                    render={<Link to={item.to} params={{ workspace }} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
