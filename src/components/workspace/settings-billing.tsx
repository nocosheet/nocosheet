import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";

export function SettingsBilling() {
  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Billing</CardFrameTitle>
        <CardFrameDescription>
          Nocosheet is open source and self-hosted, so there is nothing to subscribe to.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Current plan"
          description="You run this instance on your own infrastructure."
          badge={
            <Badge variant="info" size="sm">
              Self-hosted
            </Badge>
          }
        />
        <SettingsRow
          title="Hosting costs"
          description="Usage is billed by your cloud provider, not by Nocosheet."
        />
      </Card>
    </CardFrame>
  );
}
