import { useRouteContext } from "@tanstack/react-router";

import { ImpersonationBanner } from "@/components/workspace/member-admin/impersonation-banner";

import { AppHeader } from "./app-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session } = useRouteContext({ from: "__root__" });

  return (
    <div className="flex min-h-svh flex-col">
      <ImpersonationBanner />
      <AppHeader user={session?.user ?? null} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
