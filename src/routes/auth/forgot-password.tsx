import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <>
      <AuthHeader
        title="Forgot your password?"
        description="Enter your email and we'll send you a reset link."
      />
      <ForgotPasswordForm />
      <AuthFooter>
        <Link to="/auth/sign-in" className="text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </AuthFooter>
    </>
  );
}
