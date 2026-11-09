import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { FingerprintPatternIcon } from "lucide-react";

import { SettingsRow } from "@/components/shared/settings-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { toastManager } from "@/components/ui/toast";
import { addPasskeyMutationOptions } from "@/data/auth/add-passkey";
import { deletePasskeyMutationOptions } from "@/data/auth/delete-passkey";
import { passkeysQueryOptions } from "@/data/auth/passkeys";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { parseUserAgent } from "@/lib/user-agent";

export function PasskeysCard() {
  const queryClient = useQueryClient();
  const { data: passkeys } = useSuspenseQuery(passkeysQueryOptions);
  const supported = typeof PublicKeyCredential !== "undefined";

  const refresh = () => queryClient.invalidateQueries(passkeysQueryOptions);

  const addPasskey = useMutation({
    ...addPasskeyMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: "Passkey added" });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't add passkey",
        description: error.message,
      }),
  });

  const deletePasskey = useMutation({
    ...deletePasskeyMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: "Passkey removed" });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't remove passkey",
        description: error.message,
      }),
  });

  function handleAdd() {
    const { browser, os } = parseUserAgent(navigator.userAgent);
    addPasskey.mutate({ name: `${browser} on ${os}` });
  }

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Passkeys</CardFrameTitle>
        <CardFrameDescription>
          {supported
            ? "Sign in with your fingerprint, face or device PIN instead of a password."
            : "This browser doesn't support passkeys."}
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        {passkeys.length === 0 ? (
          <SettingsRow
            title="No passkeys yet"
            description="Add one to sign in without typing a password."
          />
        ) : (
          passkeys.map((passkey) => (
            <div key={passkey.id} className="flex items-center gap-4 p-4 not-last:border-b md:px-6">
              <FingerprintPatternIcon className="size-5 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate font-medium text-sm">{passkey.name || "Unnamed passkey"}</p>
                <p className="truncate text-muted-foreground text-sm">
                  Added {formatRelativeTime(passkey.createdAt)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={deletePasskey.isPending && deletePasskey.variables?.id === passkey.id}
                onClick={() => deletePasskey.mutate({ id: passkey.id })}
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </Card>
      <CardFrameFooter className="flex justify-end">
        <Button
          type="button"
          disabled={!supported}
          loading={addPasskey.isPending}
          onClick={handleAdd}
        >
          Add passkey
        </Button>
      </CardFrameFooter>
    </CardFrame>
  );
}
