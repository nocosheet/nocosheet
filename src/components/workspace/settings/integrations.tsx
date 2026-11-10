import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";

export function SettingsIntegrations() {
  return (
    <div className="flex flex-col gap-6">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Webhooks</CardFrameTitle>
          <CardFrameDescription>
            Send an HTTP request to your own endpoints when records are created, updated or deleted.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <SettingsRow
            title="Endpoints"
            description="No webhooks configured."
            badge={
              <Badge variant="secondary" size="sm">
                Coming soon
              </Badge>
            }
          >
            <Button variant="outline" disabled className="w-fit">
              Add webhook
            </Button>
          </SettingsRow>
        </Card>
      </CardFrame>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Connected apps</CardFrameTitle>
          <CardFrameDescription>
            Connect Nocosheet to the tools your team already uses.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <SettingsRow title="Apps" description="No apps connected.">
            <Button variant="outline" disabled className="w-fit">
              Browse apps
            </Button>
          </SettingsRow>
        </Card>
      </CardFrame>
    </div>
  );
}
