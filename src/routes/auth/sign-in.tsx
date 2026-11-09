import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { PasskeySignInButton } from "@/components/auth/passkey-sign-in-button";
import { SignInForm } from "@/components/auth/sign-in-form";

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <>
      <AuthHeader title="Welcome back" description="Sign in to your account to continue." />
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 items-start gap-3">
          <GoogleSignInButton collapsed />
          <PasskeySignInButton collapsed />
        </div>
        <AuthDivider />
        <SignInForm />
      </div>
      <AuthFooter>
        Don't have an account?{" "}
        <Link to="/auth/sign-up" className="text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </AuthFooter>
    </>
  );
}
