import { createFileRoute, Outlet } from "@tanstack/react-router";

import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ImpersonationBanner } from "@/components/workspace/member-admin/impersonation-banner";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/w/$workspace/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { workspace } = Route.useParams();
  const session = useSession();

  return (
    <SidebarProvider>
      <WorkspaceSidebar workspace={workspace} user={session!.user} />
      <SidebarInset>
        <ImpersonationBanner />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
