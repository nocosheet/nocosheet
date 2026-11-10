import { SettingsRow } from "@/components/shared/settings-row";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";

import { DeleteMemberDialog } from "./delete-member-dialog";

type MemberDangerZoneProps = { member: { id: string; name: string; email: string } };

export function MemberDangerZone({ member }: MemberDangerZoneProps) {
  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Danger zone</CardFrameTitle>
        <CardFrameDescription>Irreversible actions for this member.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Delete member"
          description="Permanently remove their account and all of its sessions."
        >
          <DeleteMemberDialog userId={member.id} name={member.name} email={member.email} />
        </SettingsRow>
      </Card>
    </CardFrame>
  );
}
