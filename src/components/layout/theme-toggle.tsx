import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu, MenuPopup, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "@/components/ui/menu";
import { usePreference } from "@/hooks/use-preference";
import type { Theme } from "@/lib/preferences";

export function ThemeToggle() {
  const [theme, setTheme] = usePreference("theme");

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Change theme" />
        }
      >
        <SunIcon className="dark:hidden" />
        <MoonIcon className="hidden dark:block" />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
          <MenuRadioItem value="light">
            <SunIcon className="me-2 inline" />
            Light
          </MenuRadioItem>
          <MenuRadioItem value="dark">
            <MoonIcon className="me-2 inline" />
            Dark
          </MenuRadioItem>
          <MenuRadioItem value="system">
            <MonitorIcon className="me-2 inline" />
            System
          </MenuRadioItem>
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}
