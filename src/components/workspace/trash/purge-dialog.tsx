import { useState } from "react";

import { Trash2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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

export function PurgeDialog({
  label,
  description,
  pending,
  error,
  onConfirm,
  onReset,
}: {
  label: string;
  description: string;
  pending: boolean;
  error?: Error | null;
  onConfirm: (done: () => void) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onReset();
      }}
    >
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Delete ${label} forever`} />}
      >
        <Trash2Icon />
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete forever?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="px-6 pb-2">
            <Alert variant="error">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            loading={pending}
            onClick={() => onConfirm(() => setOpen(false))}
          >
            Delete forever
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
