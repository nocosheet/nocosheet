import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { OTPField, OTPFieldInput } from "@/components/ui/otp-field";
import { toastManager } from "@/components/ui/toast";
import { verifyTotpMutationOptions } from "@/data/auth/verify-totp";

type TotpEnrollDialogProps = {
  open: boolean;
  totpURI: string;
  onCancel: () => void;
  onVerified: () => void;
};

export function TotpEnrollDialog({ open, totpURI, onCancel, onVerified }: TotpEnrollDialogProps) {
  const [code, setCode] = useState("");
  // Lets people without a camera type the key into their authenticator instead.
  const secret = new URL(totpURI).searchParams.get("secret");

  const verify = useMutation({
    ...verifyTotpMutationOptions,
    onSuccess: onVerified,
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't verify the code",
        description: error.message,
      }),
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Set up your authenticator app</DialogTitle>
          <DialogDescription>
            Scan the QR code with an app like 1Password, Authy or Google Authenticator, then enter
            the 6-digit code it shows.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col items-center gap-5">
          <div className="rounded-lg border bg-white p-3">
            <QRCodeSVG value={totpURI} size={176} />
          </div>
          {secret && (
            <p className="text-center text-muted-foreground text-xs">
              Can't scan? Enter this key instead:
              <br />
              <code className="break-all font-mono text-foreground">{secret}</code>
            </p>
          )}
          <Field className="items-center">
            <FieldLabel className="sr-only">Authentication code</FieldLabel>
            <OTPField length={6} value={code} onValueChange={setCode}>
              <OTPFieldInput />
              <OTPFieldInput aria-label="Digit 2 of 6" />
              <OTPFieldInput aria-label="Digit 3 of 6" />
              <OTPFieldInput aria-label="Digit 4 of 6" />
              <OTPFieldInput aria-label="Digit 5 of 6" />
              <OTPFieldInput aria-label="Digit 6 of 6" />
            </OTPField>
          </Field>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            type="button"
            disabled={code.length !== 6}
            loading={verify.isPending}
            onClick={() => verify.mutate({ code })}
          >
            Verify and enable
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
