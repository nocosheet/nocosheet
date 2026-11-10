import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AccountTabs } from "@/components/account/account-tabs";
import { AppHeader } from "@/components/layout/app-header";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { accountsQueryOptions } from "@/data/auth/accounts";

export const Route = createFileRoute("/account")({
  beforeLoad: ({ context }) => {
    if (!context.session) throw redirect({ to: "/auth/sign-in" });
  },
  loader: ({ context }) =>
    context.queryClient.query({ ...accountsQueryOptions, staleTime: "static" }),
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <ImpersonationBanner />
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-2xl tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground text-sm">
              Update your profile, security and devices.
            </p>
          </div>
          <AccountTabs />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
