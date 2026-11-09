import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { TwoFactorChallenge } from "@/components/auth/two-factor-challenge";

export const Route = createFileRoute("/auth/two-factor")({
  component: TwoFactorPage,
});

function TwoFactorPage() {
  return (
    <>
      <AuthHeader
        title="Two-factor authentication"
        description="Enter the code from your authenticator app to finish signing in."
      />
      <TwoFactorChallenge />
      <AuthFooter>
        <Link to="/auth/sign-in" className="text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </AuthFooter>
    </>
  );
}
