import { useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmActionProps = {
  /** Label of the button that opens the dialog. */
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  disabled?: boolean;
  onConfirm: () => Promise<unknown> | void;
};

/** A button that asks for confirmation before running a one-click admin action. */
export function ConfirmAction({
  label,
  title,
  description,
  confirmLabel,
  destructive,
  pending,
  disabled,
  onConfirm,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant={destructive ? "destructive-outline" : "outline"}
            disabled={disabled}
            className="w-fit"
          />
        }
      >
        {label}
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant={destructive ? "destructive" : "default"}
            loading={pending}
            onClick={async () => {
              try {
                await onConfirm();
                setOpen(false);
              } catch {
                // The caller reports the failure (toast); keep the dialog open to retry.
              }
            }}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
