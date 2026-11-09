import { useState } from "react";

import { Button } from "@/components/ui/button";

import { TwoFactorBackupForm } from "./two-factor-backup-form";
import { TwoFactorTotpForm } from "./two-factor-totp-form";

export function TwoFactorChallenge() {
  const [method, setMethod] = useState<"totp" | "backup">("totp");

  return (
    <div className="flex flex-col gap-4">
      {method === "totp" ? <TwoFactorTotpForm /> : <TwoFactorBackupForm />}
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => setMethod(method === "totp" ? "backup" : "totp")}
      >
        {method === "totp" ? "Use a backup code instead" : "Use your authenticator app instead"}
      </Button>
    </div>
  );
}
