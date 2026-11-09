import { createFileRoute } from "@tanstack/react-router";

import { LinkedAccounts } from "@/components/account/linked-accounts";
import { SessionsList } from "@/components/account/sessions-list";
import { sessionsQueryOptions } from "@/data/auth/sessions";

export const Route = createFileRoute("/account/devices")({
  loader: ({ context }) => context.queryClient.ensureQueryData(sessionsQueryOptions),
  component: DevicesPage,
});

function DevicesPage() {
  const { session } = Route.useRouteContext();

  return (
    <>
      <SessionsList currentSessionId={session!.session.id} />
      <LinkedAccounts />
    </>
  );
}
