import { Link } from "@tanstack/react-router";

import { ChevronsUpDownIcon, LogOutIcon, UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/hooks/use-sign-out";
import { getInitials } from "@/lib/initials";

type NavUserProps = {
  user: { name: string; email: string; image?: string | null };
};

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const signOut = useSignOut();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label="Open user menu"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback className="rounded-lg">
                {getInitials(user.name) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start leading-tight">
              <span className="truncate font-medium text-sm">{user.name}</span>
              <span className="truncate text-muted-foreground text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ms-auto size-4" />
          </MenuTrigger>
          <MenuPopup
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
            className="min-w-56"
          >
            <div className="flex flex-col px-2 py-1.5">
              <span className="truncate font-medium text-sm">{user.name}</span>
              <span className="truncate text-muted-foreground text-xs">{user.email}</span>
            </div>
            <MenuSeparator />
            <MenuGroup>
              <MenuLinkItem render={<Link to="/account" />}>
                <UserIcon />
                Account
              </MenuLinkItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuItem
              variant="destructive"
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
            >
              <LogOutIcon />
              Sign out
            </MenuItem>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
