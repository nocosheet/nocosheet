import { SettingsRow } from "@/components/shared/settings-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";

const sections = [
  {
    title: "Import",
    description: "Bring data in from other tools.",
    title2: "Import data",
    row: "Create tables from CSV or spreadsheet files.",
    action: "Import",
  },
  {
    title: "Export",
    description: "Take your data with you.",
    title2: "Export data",
    row: "Download tables as CSV or JSON.",
    action: "Export",
  },
  {
    title: "Backup",
    description: "Protect this instance against data loss.",
    title2: "Backups",
    row: "Create and restore full snapshots of the workspace.",
    action: "Back up",
  },
];

export function SettingsData() {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <CardFrame key={section.title}>
          <CardFrameHeader>
            <CardFrameTitle>{section.title}</CardFrameTitle>
            <CardFrameDescription>{section.description}</CardFrameDescription>
          </CardFrameHeader>
          <Card>
            <SettingsRow title={section.title2} description={section.row}>
              <Button variant="outline" disabled className="w-fit">
                {section.action} · coming soon
              </Button>
            </SettingsRow>
          </Card>
        </CardFrame>
      ))}
    </div>
  );
}
