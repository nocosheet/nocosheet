import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useSession } from "@/hooks/use-session";
import { readSidebarDefaultOpen } from "@/hooks/use-sidebar-default";

export const Route = createFileRoute("/w/$workspace/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { workspace } = Route.useParams();
  const session = useSession();

  return (
    <SidebarProvider defaultOpen={readSidebarDefaultOpen()}>
      <WorkspaceSidebar workspace={workspace} user={session!.user} />
      <SidebarInset>
        <ImpersonationBanner />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
