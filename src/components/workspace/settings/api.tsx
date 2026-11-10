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

export function SettingsApi() {
  return (
    <div className="flex flex-col gap-6">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>API access</CardFrameTitle>
          <CardFrameDescription>
            Read and write your tables programmatically with a REST API.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <SettingsRow
            title="Status"
            description="The API opens up once tables are available."
            badge={
              <Badge variant="secondary" size="sm">
                Coming soon
              </Badge>
            }
          />
          <SettingsRow title="Documentation" description="Endpoints, authentication and examples.">
            <Button variant="outline" disabled className="w-fit">
              View docs
            </Button>
          </SettingsRow>
        </Card>
      </CardFrame>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Personal access tokens</CardFrameTitle>
          <CardFrameDescription>
            Tokens authenticate scripts and tools on your behalf. Treat them like passwords.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <SettingsRow title="Tokens" description="You haven't created any tokens yet.">
            <Button variant="outline" disabled className="w-fit">
              Create token
            </Button>
          </SettingsRow>
        </Card>
      </CardFrame>
    </div>
  );
}
