import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { Link, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { ToastProvider } from "@/components/ui/toast";
import { sessionQueryOptions } from "@/data/auth/session";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ context }) => ({
    session: await context.queryClient.query(sessionQueryOptions),
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <div>
      <p>Page not found</p>
      <Link to="/">Home</Link>
    </div>
  ),
});

function RootComponent() {
  return (
    <ToastProvider>
      <Outlet />
      <TanStackDevtools
        plugins={[
          { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
          { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel /> },
        ]}
      />
    </ToastProvider>
  );
}
