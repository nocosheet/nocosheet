import { createFileRoute } from "@tanstack/react-router";

import { LinkedAccounts } from "@/components/account/linked-accounts";
import { SessionsList } from "@/components/account/sessions-list";
import { useSession } from "@/hooks/use-session";
import { sessionsQueryOptions } from "@/data/auth/sessions";

export const Route = createFileRoute("/account/devices")({
  loader: ({ context }) =>
    context.queryClient.query({ ...sessionsQueryOptions, staleTime: "static" }),
  component: DevicesPage,
});

function DevicesPage() {
  const session = useSession();

  return (
    <>
      <SessionsList currentSessionId={session!.session.id} />
      <LinkedAccounts />
    </>
  );
}
