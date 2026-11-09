import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { SettingsRow } from "@/components/shared/settings-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { accountsQueryOptions } from "@/data/auth/accounts";
import { linkSocialMutationOptions } from "@/data/auth/link-social";
import { unlinkAccountMutationOptions } from "@/data/auth/unlink-account";

export function LinkedAccounts() {
  const queryClient = useQueryClient();
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions);

  const credential = accounts.find((account) => account.providerId === "credential");
  const google = accounts.find((account) => account.providerId === "google");

  const linkSocial = useMutation(linkSocialMutationOptions);
  const unlinkAccount = useMutation({
    ...unlinkAccountMutationOptions,
    onSuccess: () => queryClient.invalidateQueries(accountsQueryOptions),
  });

  const error = linkSocial.error ?? unlinkAccount.error;
  // Better Auth refuses to unlink the last sign-in method.
  const onlyMethod = accounts.length <= 1;

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Linked Accounts</CardFrameTitle>
        <CardFrameDescription>Sign-in methods connected to your account.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Email & Password"
          description="Sign in with your email address and a password."
          badge={
            <Badge variant={credential ? "success" : "secondary"} size="sm">
              {credential ? "Connected" : "Not set"}
            </Badge>
          }
        />
        <SettingsRow
          title="Google"
          description={
            google && onlyMethod
              ? "Your only sign-in method, so it can't be unlinked."
              : "Sign in with your Google account."
          }
          badge={
            <Badge variant={google ? "success" : "secondary"} size="sm">
              {google ? "Connected" : "Not connected"}
            </Badge>
          }
        >
          <div className="md:self-end">
            {google ? (
              <Button
                type="button"
                variant="outline"
                disabled={onlyMethod}
                loading={unlinkAccount.isPending}
                onClick={() => unlinkAccount.mutate({ accountId: google.id })}
              >
                Unlink
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                loading={linkSocial.isPending}
                onClick={() => linkSocial.mutate({ provider: "google" })}
              >
                Link
              </Button>
            )}
          </div>
        </SettingsRow>
      </Card>
      {error && (
        <div className="px-6 py-4">
          <Alert variant="error">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      )}
    </CardFrame>
  );
}
