import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { generateBackupCodesMutationOptions } from "@/data/auth/generate-backup-codes";

import { PasswordConfirmDialog } from "../password-confirm-dialog";
import { BackupCodesDialog } from "./backup-codes-dialog";

export function RegenerateBackupCodes() {
  const [confirming, setConfirming] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);

  const generate = useMutation({
    ...generateBackupCodesMutationOptions,
    onSuccess: (data) => {
      setConfirming(false);
      setCodes(data.backupCodes);
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't generate backup codes",
        description: error.message,
      }),
  });

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
        New backup codes
      </Button>
      <PasswordConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Generate new backup codes"
        description="Your existing backup codes will stop working. Confirm your password to continue."
        confirmLabel="Generate"
        pending={generate.isPending}
        onConfirm={(password) => generate.mutate({ password })}
      />
      {codes && <BackupCodesDialog open codes={codes} onDone={() => setCodes(null)} />}
    </>
  );
}
