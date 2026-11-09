import { useMutation } from "@tanstack/react-query";

import { FingerprintPatternIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signInPasskeyMutationOptions } from "@/data/auth/sign-in-passkey";
import { useCompleteSignIn } from "@/hooks/use-complete-sign-in";

import { AuthErrorAlert } from "./auth-error-alert";

export function PasskeySignInButton({ collapsed = false }: { collapsed?: boolean }) {
  const completeSignIn = useCompleteSignIn();

  const mutation = useMutation({
    ...signInPasskeyMutationOptions,
    onSuccess: completeSignIn,
  });

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        loading={mutation.isPending}
        onClick={() => mutation.mutate({ autoFill: false })}
      >
        <FingerprintPatternIcon />
        {collapsed ? "Passkey" : "Sign in with passkey"}
      </Button>
      <AuthErrorAlert error={mutation.error} />
    </div>
  );
}
