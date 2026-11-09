import { createFileRoute } from "@tanstack/react-router";

import { AuthHeader } from "@/components/auth/auth-header";
import { SetupForm } from "@/components/auth/setup-form";

export const Route = createFileRoute("/auth/setup")({
  component: SetupPage,
});

function SetupPage() {
  return (
    <>
      <AuthHeader
        title="Set up Nocosheet"
        description="Create the first account. It becomes the administrator."
      />
      <SetupForm />
    </>
  );
}
