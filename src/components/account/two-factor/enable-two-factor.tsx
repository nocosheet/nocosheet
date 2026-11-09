import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { enableTwoFactorMutationOptions } from "@/data/auth/enable-two-factor";
import { useRefreshSession } from "@/data/auth/session-refresh";

import { PasswordConfirmDialog } from "../password-confirm-dialog";
import { BackupCodesDialog } from "./backup-codes-dialog";
import { TotpEnrollDialog } from "./totp-enroll-dialog";

type Step = "closed" | "password" | "scan" | "backup";
type Enrollment = { totpURI: string; backupCodes: string[] };

export function EnableTwoFactor() {
  const [step, setStep] = useState<Step>("closed");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const refreshSession = useRefreshSession();

  const enable = useMutation({
    ...enableTwoFactorMutationOptions,
    onSuccess: (data) => {
      setEnrollment({ totpURI: data.totpURI, backupCodes: data.backupCodes });
      setStep("scan");
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't start setup",
        description: error.message,
      }),
  });

  function close() {
    setStep("closed");
    setEnrollment(null);
  }

  return (
    <>
      <Button type="button" onClick={() => setStep("password")}>
        Enable
      </Button>
      <PasswordConfirmDialog
        open={step === "password"}
        onOpenChange={(open) => !open && close()}
        title="Enable two-factor authentication"
        description="Confirm your password to start setting up an authenticator app."
        confirmLabel="Continue"
        pending={enable.isPending}
        onConfirm={(password) => enable.mutate({ password })}
      />
      {enrollment && (
        <>
          <TotpEnrollDialog
            open={step === "scan"}
            totpURI={enrollment.totpURI}
            onCancel={close}
            onVerified={() => setStep("backup")}
          />
          <BackupCodesDialog
            open={step === "backup"}
            codes={enrollment.backupCodes}
            onDone={async () => {
              // Refreshing swaps this card to its "enabled" state, so do it only after the codes are saved.
              await refreshSession();
              toastManager.add({ type: "success", title: "Two-factor authentication enabled" });
              close();
            }}
          />
        </>
      )}
    </>
  );
}
