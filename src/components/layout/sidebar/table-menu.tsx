import { useState } from "react";

import {
  ExternalLinkIcon,
  LinkIcon,
  MoreHorizontalIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { SidebarMenuAction, useSidebar } from "@/components/ui/sidebar";
import { toastManager } from "@/components/ui/toast";
import { placeholderTables } from "@/lib/placeholder-tables-store";
import type { PlaceholderTable } from "@/lib/sidebar-placeholders";

/** The "…" menu on a sidebar table row: favorite, copy link, open in a new tab, delete. */
export function TableMenu({ table, workspace }: { table: PlaceholderTable; workspace: string }) {
  const { isMobile } = useSidebar();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const path = `/w/${workspace}/tables`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toastManager.add({ type: "success", title: "Link copied" });
    } catch {
      toastManager.add({ type: "error", title: "Couldn't copy the link" });
    }
  };

  return (
    <>
      <Menu>
        <MenuTrigger
          render={<SidebarMenuAction showOnHover aria-label={`Options for ${table.name}`} />}
        >
          <MoreHorizontalIcon />
        </MenuTrigger>
        <MenuPopup
          side={isMobile ? "bottom" : "right"}
          align={isMobile ? "end" : "start"}
          className="min-w-52"
        >
          <MenuItem onClick={() => placeholderTables.toggleFavorite(table.id)}>
            {table.favorite ? <StarOffIcon /> : <StarIcon />}
            {table.favorite ? "Remove from Favorites" : "Add to Favorites"}
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={copyLink}>
            <LinkIcon />
            Copy link
          </MenuItem>
          <MenuLinkItem render={<a href={path} target="_blank" rel="noreferrer" />}>
            <ExternalLinkIcon />
            Open in new tab
          </MenuLinkItem>
          <MenuSeparator />
          <MenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2Icon />
            Delete
          </MenuItem>
        </MenuPopup>
      </Menu>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {table.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the table and all of its records. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                placeholderTables.remove(table.id);
                setConfirmOpen(false);
                toastManager.add({ type: "success", title: `${table.name} deleted` });
              }}
            >
              Delete table
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
