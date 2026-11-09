import { SettingsRow } from "@/components/shared/settings-row";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";

import { DeleteAccountDialog } from "./delete-account-dialog";

export function DangerZone() {
  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Danger Zone</CardFrameTitle>
        <CardFrameDescription>Irreversible actions for your account.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Delete Account"
          description="Permanently delete your account and everything in it."
        >
          <div className="md:self-end">
            <DeleteAccountDialog />
          </div>
        </SettingsRow>
      </Card>
    </CardFrame>
  );
}
