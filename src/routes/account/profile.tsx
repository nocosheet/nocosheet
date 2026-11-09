import { createFileRoute } from "@tanstack/react-router";

import { DangerZone } from "@/components/account/danger-zone";
import { ProfileDetailsForm } from "@/components/account/profile-details-form";

export const Route = createFileRoute("/account/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = Route.useRouteContext();

  return (
    <>
      <ProfileDetailsForm user={session!.user} />
      <DangerZone />
    </>
  );
}
