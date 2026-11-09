import { useSuspenseQuery } from "@tanstack/react-query";

import { SettingsRow } from "@/components/shared/settings-row";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { adminUserQueryOptions } from "@/data/admin/user";

import { SetPasswordDialog } from "./set-password-dialog";

export function MemberSecurity({ userId }: { userId: string }) {
  const { data: member } = useSuspenseQuery(adminUserQueryOptions(userId));

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Security</CardFrameTitle>
        <CardFrameDescription>Help this member get back into their account.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Password"
          description="Set a new password, for example if they are locked out."
        >
          <SetPasswordDialog userId={member.id} name={member.name} />
        </SettingsRow>
      </Card>
    </CardFrame>
  );
}
