import { createFileRoute } from "@tanstack/react-router";

import { ChangePasswordForm } from "@/components/account/change-password-form";
import { PasskeysCard } from "@/components/account/passkeys-card";
import { TwoFactorCard } from "@/components/account/two-factor/two-factor-card";
import { passkeysQueryOptions } from "@/data/auth/passkeys";

export const Route = createFileRoute("/account/security")({
  loader: ({ context }) => context.queryClient.ensureQueryData(passkeysQueryOptions),
  component: SecurityPage,
});

function SecurityPage() {
  const { session } = Route.useRouteContext();

  return (
    <>
      <ChangePasswordForm />
      <PasskeysCard />
      <TwoFactorCard enabled={Boolean(session?.user.twoFactorEnabled)} />
    </>
  );
}
