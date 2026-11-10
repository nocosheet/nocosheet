import { createFileRoute } from "@tanstack/react-router";

import { DangerZone } from "@/components/account/danger-zone";
import { ProfileDetailsForm } from "@/components/account/profile-details-form";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/account/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const session = useSession();

  return (
    <>
      <ProfileDetailsForm user={session!.user} />
      <DangerZone />
    </>
  );
}
