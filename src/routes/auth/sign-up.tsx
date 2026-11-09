import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <>
      <AuthHeader title="Create your account" description="Get started in a few seconds." />
      <div className="flex flex-col gap-5">
        <GoogleSignInButton />
        <AuthDivider />
        <SignUpForm />
      </div>
      <AuthFooter>
        Already have an account?{" "}
        <Link to="/auth/sign-in" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </AuthFooter>
    </>
  );
}
