import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { WorkspaceBreadcrumbs } from "@/components/workspace/workspace-breadcrumbs";
import { cn } from "@/lib/utils";

/**
 * Top bar of every workspace page: sidebar trigger and breadcrumbs on the left, the page's
 * actions (children) on the right.
 *
 *   <WorkspaceHeader workspace={workspace}>
 *     <AddMemberDialog />
 *   </WorkspaceHeader>
 */
export function WorkspaceHeader({
  workspace,
  children,
}: {
  workspace: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="me-2 h-4" />
        <WorkspaceBreadcrumbs workspace={workspace} />
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </header>
  );
}

/** Page body under the header. Pass `className="max-w-3xl"` to narrow it (settings pages). */
export function WorkspaceContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl flex-1 px-4 pb-8 md:px-6", className)}>
      {children}
    </div>
  );
}
