import { useMutation } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { sendVerificationEmailMutationOptions } from "@/data/auth/send-verification-email";

import { AuthErrorAlert } from "./auth-error-alert";

export function ResendVerificationButton({ email }: { email: string }) {
  const mutation = useMutation(sendVerificationEmailMutationOptions);

  return (
    <div className="flex flex-col gap-3">
      {mutation.isSuccess && (
        <Alert variant="success">
          <AlertDescription>Verification email sent.</AlertDescription>
        </Alert>
      )}
      <AuthErrorAlert error={mutation.error} />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        loading={mutation.isPending}
        onClick={() => mutation.mutate({ email })}
      >
        Resend verification email
      </Button>
    </div>
  );
}
