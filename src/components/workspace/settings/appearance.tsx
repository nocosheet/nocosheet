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
import { usePreference } from "@/hooks/use-preference";
import type { SidebarDefault, Theme } from "@/lib/preferences";

import { AccentPicker } from "./accent-picker";

const themes: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const sidebarDefaults: { value: SidebarDefault; label: string }[] = [
  { value: "expanded", label: "Expanded" },
  { value: "collapsed", label: "Collapsed" },
];

export function SettingsAppearance() {
  const [theme, setTheme] = usePreference("theme");
  const [sidebarDefault, setSidebarDefault] = usePreference("sidebarDefault");
  const [accent, setAccent] = usePreference("accent");

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
        <SettingsRow
          title="Accent color"
          description="Used for buttons, focus rings and highlights."
        >
          <AccentPicker value={accent} onValueChange={setAccent} />
        </SettingsRow>
        <SettingsRow title="Sidebar" description="How the sidebar looks when a page opens.">
          <Select
            value={sidebarDefault}
            onValueChange={(value) => setSidebarDefault(value as SidebarDefault)}
            items={sidebarDefaults}
          >
            <SelectTrigger aria-label="Sidebar">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {sidebarDefaults.map((item) => (
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
