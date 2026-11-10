import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { UserRoundCogIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { stopImpersonatingMutationOptions } from "@/data/admin/stop-impersonating";
import { useRefreshSession } from "@/data/auth/session-refresh";
import { useSession } from "@/hooks/use-session";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

/** Shown on every page while an admin is signed in as someone else. */
export function ImpersonationBanner() {
  const session = useSession();
  const navigate = useNavigate();
  const refreshSession = useRefreshSession();

  const stop = useMutation({
    ...stopImpersonatingMutationOptions,
    onSuccess: async () => {
      await refreshSession({ signedOut: true });
      await navigate({
        to: "/w/$workspace/settings/members",
        params: { workspace: DEFAULT_WORKSPACE },
      });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't switch back",
        description: error.message,
      }),
  });

  if (!session?.session.impersonatedBy) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-warning/16 px-4 py-2 text-sm text-warning-foreground">
      <span className="flex items-center gap-2">
        <UserRoundCogIcon className="size-4" />
        You are signed in as <strong>{session.user.name}</strong>.
      </span>
      <Button size="xs" variant="outline" loading={stop.isPending} onClick={() => stop.mutate()}>
        Switch back
      </Button>
    </div>
  );
}
