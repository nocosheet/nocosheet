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
import { usePreferences } from "@/hooks/use-preferences";
import type { Font, Radius, SidebarDefault, Theme } from "@/lib/preferences";

import { AccentPicker } from "./accent-picker";

const themes: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const fonts: { value: Font; label: string }[] = [
  { value: "sans", label: "Sans" },
  { value: "mono", label: "Mono" },
];

const radii: { value: Radius; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "none", label: "None" },
];

const sidebarDefaults: { value: SidebarDefault; label: string }[] = [
  { value: "expanded", label: "Expanded" },
  { value: "collapsed", label: "Collapsed" },
];

export function SettingsAppearance() {
  const { preferences, setPreference } = usePreferences();

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
          <Select value={preferences.theme}
            onValueChange={(value) => setPreference("theme", value as Theme)} items={themes}>
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
          <AccentPicker
            value={preferences.accent}
            onValueChange={(value) => setPreference("accent", value)}
          />
        </SettingsRow>
        <SettingsRow title="Font" description="Typeface used across the app.">
          <Select
            value={preferences.font}
            onValueChange={(value) => setPreference("font", value as Font)}
            items={fonts}
          >
            <SelectTrigger aria-label="Font">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {fonts.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </SettingsRow>
        <SettingsRow title="Border radius" description="Rounded or square corners.">
          <Select
            value={preferences.radius}
            onValueChange={(value) => setPreference("radius", value as Radius)}
            items={radii}
          >
            <SelectTrigger aria-label="Border radius">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {radii.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </SettingsRow>
        <SettingsRow title="Sidebar" description="How the sidebar looks when a page opens.">
          <Select
            value={preferences.sidebar}
            onValueChange={(value) => setPreference("sidebar", value as SidebarDefault)}
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
