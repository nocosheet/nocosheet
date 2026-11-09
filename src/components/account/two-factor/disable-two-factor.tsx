import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { disableTwoFactorMutationOptions } from "@/data/auth/disable-two-factor";
import { useRefreshSession } from "@/data/auth/session-refresh";

import { PasswordConfirmDialog } from "../password-confirm-dialog";

export function DisableTwoFactor() {
  const [open, setOpen] = useState(false);
  const refreshSession = useRefreshSession();

  const disable = useMutation({
    ...disableTwoFactorMutationOptions,
    onSuccess: async () => {
      await refreshSession();
      toastManager.add({ type: "success", title: "Two-factor authentication disabled" });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't disable two-factor",
        description: error.message,
      }),
  });

  return (
    <>
      <Button type="button" variant="destructive-outline" onClick={() => setOpen(true)}>
        Disable
      </Button>
      <PasswordConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Disable two-factor authentication"
        description="Your account will be protected by your password alone. Confirm your password to continue."
        confirmLabel="Disable"
        destructive
        pending={disable.isPending}
        onConfirm={(password) => disable.mutate({ password })}
      />
    </>
  );
}
