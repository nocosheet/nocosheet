import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { SettingsSidebar } from "@/components/layout/settings-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useSession } from "@/hooks/use-session";
import { getPreferences } from "@/lib/preferences";

export const Route = createFileRoute("/w/$workspace/settings")({
  staticData: { crumb: "Settings" },
  component: SettingsLayout,
});

function SettingsLayout() {
  const { workspace } = Route.useParams();
  const session = useSession();

  return (
    <SidebarProvider defaultOpen={getPreferences().sidebarDefault === "expanded"}>
      <SettingsSidebar workspace={workspace} user={session!.user} />
      <SidebarInset>
        <ImpersonationBanner />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
