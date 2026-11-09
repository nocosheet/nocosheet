import { Link, useLocation } from "@tanstack/react-router";

import { LaptopIcon, ShieldIcon, UserIcon } from "lucide-react";

import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";

const tabs = [
  { to: "/account/profile", label: "Profile", icon: UserIcon },
  { to: "/account/security", label: "Security", icon: ShieldIcon },
  { to: "/account/devices", label: "Devices", icon: LaptopIcon },
] as const;

export function AccountTabs() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const value = tabs.find((tab) => pathname.startsWith(tab.to))?.to ?? tabs[0].to;

  return (
    <Tabs value={value}>
      <TabsList>
        {tabs.map(({ to, label, icon: Icon }) => (
          <TabsTab key={to} value={to} nativeButton={false} render={<Link to={to} />}>
            <Icon />
            {label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
}
