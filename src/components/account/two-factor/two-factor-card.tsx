import { useSuspenseQuery } from "@tanstack/react-query";

import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { accountsQueryOptions } from "@/data/auth/accounts";

import { DisableTwoFactor } from "./disable-two-factor";
import { EnableTwoFactor } from "./enable-two-factor";
import { RegenerateBackupCodes } from "./regenerate-backup-codes";

export function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions);
  // Better Auth asks for the password on every 2FA change, so password-less accounts can't use it.
  const hasPassword = accounts.some((account) => account.providerId === "credential");

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Additional Security</CardFrameTitle>
        <CardFrameDescription>Add a second step to protect your account.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Authenticator App"
          description={
            hasPassword
              ? "Require a code from an authenticator app when you sign in."
              : "Two-factor authentication needs an account with a password."
          }
          badge={
            enabled && (
              <Badge variant="success" size="sm">
                Enabled
              </Badge>
            )
          }
        >
          {hasPassword && (
            <div className="flex flex-wrap gap-2 md:justify-end">
              {enabled ? (
                <>
                  <RegenerateBackupCodes />
                  <DisableTwoFactor />
                </>
              ) : (
                <EnableTwoFactor />
              )}
            </div>
          )}
        </SettingsRow>
      </Card>
    </CardFrame>
  );
}
