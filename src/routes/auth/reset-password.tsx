import { createFileRoute, Link } from "@tanstack/react-router";

import { z } from "zod";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: z.object({
    token: z.string().optional(),
    error: z.string().optional(),
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token, error } = Route.useSearch();

  return (
    <>
      <AuthHeader
        title="Reset your password"
        description="Choose a new password for your account."
      />
      {token && !error ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert variant="error">
          <AlertDescription>
            This reset link is invalid or has expired.{" "}
            <Link to="/auth/forgot-password" className="underline underline-offset-4">
              Request a new one
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}
      <AuthFooter>
        <Link to="/auth/sign-in" className="text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </AuthFooter>
    </>
  );
}
