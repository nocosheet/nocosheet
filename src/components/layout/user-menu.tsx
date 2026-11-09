import { Link } from "@tanstack/react-router";

import { BookOpenIcon, LogOutIcon, UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { useSignOut } from "@/hooks/use-sign-out";
import { getInitials } from "@/lib/initials";
import { REPO_URL } from "@/lib/links";

type UserMenuProps = {
  user: { name: string; email: string; image?: string | null };
};

export function UserMenu({ user }: UserMenuProps) {
  const signOut = useSignOut();

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Open user menu"
          />
        }
      >
        <Avatar className="size-7">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback>{getInitials(user.name) || "U"}</AvatarFallback>
        </Avatar>
      </MenuTrigger>
      <MenuPopup align="end" className="min-w-56">
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
        <MenuGroup>
          <MenuLinkItem href={`${REPO_URL}#readme`} target="_blank" rel="noreferrer">
            <BookOpenIcon />
            Documentation
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
  );
}
