import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { AppHeader } from "@/components/layout/app-header";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { Button } from "@/components/ui/button";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export const Route = createFileRoute("/")({
  // Signed-in users have one workspace, so skip the landing page.
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/workspaces/$workspace", params: { workspace: DEFAULT_WORKSPACE } });
    }
  },
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <ImpersonationBanner />
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
          <h1 className="font-semibold text-4xl tracking-tight">Nocosheet</h1>
          <p className="text-muted-foreground">
            An open-source no-code database. Model your data, manage records and publish content
            without writing code.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" render={<Link to="/auth/sign-in" />}>
              Sign in
            </Button>
            <Button render={<Link to="/auth/sign-up" />}>Get started</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
