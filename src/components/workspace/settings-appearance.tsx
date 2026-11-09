import { SettingsRow } from "@/components/shared/settings-row";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme, type Theme } from "@/hooks/use-theme";

const themes: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function SettingsAppearance() {
  const { theme, setTheme } = useTheme();

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Appearance</CardFrameTitle>
        <CardFrameDescription>
          Customize how Nocosheet looks for you. Saved in this browser only.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow title="Color mode" description="Match your system or pick a fixed mode.">
          <Select value={theme} onValueChange={(value) => setTheme(value as Theme)} items={themes}>
            <SelectTrigger aria-label="Color mode">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {themes.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </SettingsRow>
      </Card>
    </CardFrame>
  );
}
