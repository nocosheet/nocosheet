import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SettingsSidebar } from "@/components/layout/settings-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ImpersonationBanner } from "@/components/workspace/member-admin/impersonation-banner";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/w/$workspace/settings")({
  staticData: { crumb: "Settings" },
  component: SettingsLayout,
});

function SettingsLayout() {
  const { workspace } = Route.useParams();
  const session = useSession();

  return (
    <SidebarProvider>
      <SettingsSidebar workspace={workspace} user={session!.user} />
      <SidebarInset>
        <ImpersonationBanner />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
