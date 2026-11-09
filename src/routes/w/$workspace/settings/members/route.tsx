import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$workspace/settings/members")({
  staticData: { crumb: "Members" },
  component: Outlet,
});
