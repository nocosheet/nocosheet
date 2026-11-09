import { createFileRoute, Link } from "@tanstack/react-router";

import { z } from "zod";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: z.object({
    email: z.string().optional(),
    error: z.string().optional(),
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email, error } = Route.useSearch();

  return (
    <>
      <AuthHeader
        title="Check your email"
        description={
          email ? `We sent a verification link to ${email}.` : "We sent you a verification link."
        }
      />
      {error && (
        <Alert variant="error">
          <AlertDescription>
            This verification link is invalid or has expired. Request a new one below.
          </AlertDescription>
        </Alert>
      )}
      {email && <ResendVerificationButton email={email} />}
      <AuthFooter>
        <Link to="/auth/sign-in" className="text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </AuthFooter>
    </>
  );
}
