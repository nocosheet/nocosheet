import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  ExternalLinkIcon,
  LinkIcon,
  MoreHorizontalIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { setFavoriteMutationOptions } from "@/data/workspace/favorite";
import { workspaceKeys } from "@/data/workspace/keys";
import { deleteTablesMutationOptions } from "@/data/workspace/tables";
import { useWorkspace } from "@/hooks/use-workspace";
import type { SidebarTable } from "@/lib/tables/sidebar";

/** The "…" menu on a sidebar table row: favorite, copy link, open in a new tab, delete. */
export function TableMenu({ table, workspace }: { table: SidebarTable; workspace: string }) {
  const { isMobile } = useSidebar();
  const { isAdmin } = useWorkspace();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const setFavorite = useMutation({
    ...setFavoriteMutationOptions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.sidebar() }),
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't update favorites",
        description: error.message,
      }),
  });

  const deleteTable = useMutation({
    ...deleteTablesMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });
      setConfirmOpen(false);
      toastManager.add({ type: "success", title: `${table.name} deleted` });
    },
  });

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
          <MenuItem
            onClick={() =>
              setFavorite.mutate({ workspace, id: table.id, favorite: !table.favorite })
            }
          >
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
          {isAdmin && (
            <>
              <MenuSeparator />
              <MenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                <Trash2Icon />
                Delete
              </MenuItem>
            </>
          )}
        </MenuPopup>
      </Menu>
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) deleteTable.reset();
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {table.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the table along with its columns, views, widgets and every
              record. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTable.error && (
            <div className="px-6 pb-2">
              <Alert variant="error">
                <AlertDescription>{deleteTable.error.message}</AlertDescription>
              </Alert>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
            <Button
              variant="destructive"
              loading={deleteTable.isPending}
              onClick={() => deleteTable.mutate({ workspace, ids: [table.id] })}
            >
              Delete table
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
