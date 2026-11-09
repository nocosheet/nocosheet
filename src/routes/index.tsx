import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export const Route = createFileRoute("/")({
  // Signed-in users have one workspace, so skip the landing page.
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/w/$workspace", params: { workspace: DEFAULT_WORKSPACE } });
    }
  },
  component: Home,
});

function Home() {
  return (
    <AppShell>
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
    </AppShell>
  );
}
